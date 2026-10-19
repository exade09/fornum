import {
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  type TokenBalance,
} from "@solana/web3.js";
import { connect } from "@/lib/solana/read";
import { isValidAddress } from "@/lib/solana/wallet";
import { PRIORITY_FEE_SOL, build, signAndSend } from "@/lib/pump/portal";
import "server-only";

/**
 * Buying the Fornum token with Fornum's share, and burning what was bought
 *
 * The share sits on the launch wallet of the coin that earned it, so that
 * wallet is the one that buys: one buy through PumpPortal, which finds the
 * coin on the curve or in its pump.fun pool, then one burn of exactly what the
 * buy brought in. When that empties the token account it is closed in the same
 * transaction and its rent comes back to the wallet. Both work for the old
 * token program and Token-2022, whose burn and close are laid out the same way
 */

/** The coin the share buys, FORNUM_TOKEN_MINT on the host. Unset means no buyback */
export function fornumTokenMint(): string | null {
  const v = process.env.FORNUM_TOKEN_MINT?.trim();
  return v && isValidAddress(v) ? v : null;
}

/** Below this a buy is mostly fees, so the share waits for more */
export const MIN_BUYBACK_LAMPORTS = 1_000_000;

/** Network fees of the buy and the burn, with the priority fee */
const NETWORK_LAMPORTS = 100_000;
/** PumpPortal's cut of a buy, 0.5%, with a little room */
const PORTAL_SHARE = 0.006;

/** How much SOL a waiting share can put into the buy itself */
export function buyAmountLamports(available: number) {
  return Math.max(Math.floor((available - NETWORK_LAMPORTS) / (1 + PORTAL_SHARE)), 0);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A confirmed transaction can take a moment to be readable, so ask a few times */
async function readTx(signature: string) {
  const connection = connect();
  for (let i = 0; i < 10; i++) {
    const tx = await connection
      .getTransaction(signature, { commitment: "confirmed", maxSupportedTransactionVersion: 0 })
      .catch(() => null);
    if (tx?.meta) return tx;
    await sleep(1_500);
  }
  return null;
}

type Receipt = NonNullable<Awaited<ReturnType<typeof readTx>>>;

/** SOL the fee payer, the first account, lost in a transaction. Negative when it gained */
function payerSpent(tx: Receipt) {
  return tx.meta!.preBalances[0] - tx.meta!.postBalances[0];
}

/** How much of the coin the wallet gained, raw units */
function tokenDelta(tx: Receipt, owner: string, mint: string) {
  const mine = (list: TokenBalance[] | null | undefined) =>
    (list ?? [])
      .filter((b) => b.owner === owner && b.mint === mint)
      .reduce((a, b) => a + BigInt(b.uiTokenAmount.amount), BigInt(0));
  const decimals =
    [...(tx.meta!.postTokenBalances ?? []), ...(tx.meta!.preTokenBalances ?? [])].find(
      (b) => b.mint === mint,
    )?.uiTokenAmount.decimals ?? 6;
  return {
    amount: mine(tx.meta!.postTokenBalances) - mine(tx.meta!.preTokenBalances),
    decimals,
  };
}

/** The wallet's account for the coin, with the program that owns it */
async function holding(owner: PublicKey, mint: PublicKey) {
  const { value } = await connect().getParsedTokenAccountsByOwner(owner, { mint }, "confirmed");
  const accounts = value.map((v) => ({
    address: v.pubkey,
    program: v.account.owner,
    lamports: v.account.lamports,
    amount: BigInt(v.account.data.parsed.info.tokenAmount.amount as string),
    decimals: v.account.data.parsed.info.tokenAmount.decimals as number,
  }));
  accounts.sort((a, b) => (a.amount > b.amount ? -1 : a.amount < b.amount ? 1 : 0));
  return accounts[0] ?? null;
}

function u64(n: bigint) {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(n);
  return b;
}

/**
 * Burns up to `amount` of the coin from the signer's wallet, and closes the
 * account when that empties it
 */
export async function burn(signer: Keypair, mintAddress: string, amount: bigint) {
  const mint = new PublicKey(mintAddress);
  const held = await holding(signer.publicKey, mint);
  if (!held || held.amount === BigInt(0)) {
    throw new Error("Nothing of the coin on this wallet to burn");
  }
  const toBurn = amount < held.amount ? amount : held.amount;

  const tx = new Transaction().add(
    // BurnChecked: account, mint, owner. Data: 15, amount u64, decimals u8
    new TransactionInstruction({
      programId: held.program,
      keys: [
        { pubkey: held.address, isSigner: false, isWritable: true },
        { pubkey: mint, isSigner: false, isWritable: true },
        { pubkey: signer.publicKey, isSigner: true, isWritable: false },
      ],
      data: Buffer.concat([Buffer.from([15]), u64(toBurn), Buffer.from([held.decimals])]),
    }),
  );
  const empties = toBurn === held.amount;
  if (empties) {
    // CloseAccount: account, destination, owner. Data: 9
    tx.add(
      new TransactionInstruction({
        programId: held.program,
        keys: [
          { pubkey: held.address, isSigner: false, isWritable: true },
          { pubkey: signer.publicKey, isSigner: false, isWritable: true },
          { pubkey: signer.publicKey, isSigner: true, isWritable: false },
        ],
        data: Buffer.from([9]),
      }),
    );
  }

  const signature = await sendAndConfirmTransaction(connect(), tx, [signer], {
    commitment: "confirmed",
  });
  const read = await readTx(signature);
  // without the receipt: one signature's fee, less the rent a close gave back
  const spent = read ? payerSpent(read) : 5_000 - (empties ? held.lamports : 0);
  return { signature, burned: toBurn, decimals: held.decimals, spentLamports: spent };
}

export type BuybackResult = {
  buyTx: string;
  bought: bigint;
  decimals: number;
  burnTx: string | null;
  burned: bigint;
  /** SOL that left the wallet for both, net of rent a close gave back */
  spentLamports: number;
  burnError?: string;
};

/**
 * Buys the Fornum token with up to `availableLamports` from the signer's
 * wallet and burns what it bought
 *
 * A failed buy throws and nothing is spent. A failed burn does not throw: the
 * buy already happened and has to be recorded, so the result says the tokens
 * are still on the wallet and the burn can be tried again later
 */
export async function buyAndBurn(
  signer: Keypair,
  mint: string,
  availableLamports: number,
): Promise<BuybackResult> {
  const lamports = buyAmountLamports(availableLamports);
  if (lamports <= 0) throw new Error("Too little to buy with");

  const tx = await build({
    publicKey: signer.publicKey.toBase58(),
    action: "buy",
    mint,
    denominatedInSol: "true",
    amount: lamports / 1e9,
    slippage: 15,
    priorityFee: PRIORITY_FEE_SOL,
    pool: "auto",
  });
  const buyTx = await signAndSend(tx, [signer]);

  const read = await readTx(buyTx);
  let bought: bigint;
  let decimals: number;
  let spent: number;
  if (read) {
    ({ amount: bought, decimals } = tokenDelta(read, signer.publicKey.toBase58(), mint));
    spent = payerSpent(read);
  } else {
    // no receipt yet: count the most the buy could have cost, and burn what is held
    const held = await holding(signer.publicKey, new PublicKey(mint));
    bought = held?.amount ?? BigInt(0);
    decimals = held?.decimals ?? 6;
    spent = Math.ceil(lamports * (1 + PORTAL_SHARE)) + NETWORK_LAMPORTS / 2 + (held?.lamports ?? 0);
  }

  if (bought <= BigInt(0)) {
    return {
      buyTx,
      bought: BigInt(0),
      decimals,
      burnTx: null,
      burned: BigInt(0),
      spentLamports: spent,
      burnError: "The buy brought in no tokens",
    };
  }

  try {
    const b = await burn(signer, mint, bought);
    return {
      buyTx,
      bought,
      decimals,
      burnTx: b.signature,
      burned: b.burned,
      spentLamports: spent + b.spentLamports,
    };
  } catch (err) {
    return {
      buyTx,
      bought,
      decimals,
      burnTx: null,
      burned: BigInt(0),
      spentLamports: spent,
      burnError: err instanceof Error ? err.message : String(err),
    };
  }
}
