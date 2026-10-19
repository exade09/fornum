import {
  ComputeBudgetProgram,
  type AccountInfo,
  type Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { connect } from "@/lib/solana/read";
import {
  CURVE_CREATOR_FEE,
  POOL_CREATOR_FEES,
  ammVault,
  bondingCurve,
  canonicalPool,
  collectInstructions,
  curveVault,
} from "@/lib/pump/collect";
import "server-only";

/**
 * What pump.fun is holding for a Fornum launch wallet, and bringing it home
 *
 * A creator fee can be in four places before it reaches the creator:
 *
 *   - waiting on the bonding curve, `BondingCurve.creator_fee` (v3 trades)
 *   - in the curve's creator vault, a plain SOL account (older trades, sweeps)
 *   - waiting on the PumpSwap pool, `Pool.creator_fees` (after graduating)
 *   - in the pool's creator vault, a wrapped SOL account
 *
 * Each launch wallet creates exactly one coin, so all four belong to that one
 * token and nothing has to be attributed
 */

/** Rent exemption of a zero byte account, which the curve vault keeps back */
const EMPTY_RENT = 890_880;

const u64 = (info: AccountInfo<Buffer> | null, at: number) =>
  info && info.data.length >= at + 8 ? Number(info.data.readBigUInt64LE(at)) : 0;

export type WalletFees = {
  /** what the launch wallet itself holds */
  walletLamports: number;
  /**
   * In the creator vaults. Those are per creator, not per coin, so when one
   * wallet ever made two coins this part is shared between them
   */
  sharedLamports: number;
  /** waiting on this coin's own curve and pool, which is this coin's alone */
  ownLamports: number;
  /** earned but still with pump.fun, not collected yet: shared plus own */
  uncollectedLamports: number;
};

/**
 * Wallet balance and uncollected creator fees for many launches
 *
 * Five accounts per launch, read in batches, so a page of tokens costs a
 * couple of RPC calls rather than several per token
 */
export async function readWalletFees(
  launches: { wallet: string; mint: string }[],
): Promise<Map<string, WalletFees>> {
  // keyed by mint, since one wallet can be behind more than one coin
  const out = new Map<string, WalletFees>();
  if (launches.length === 0) return out;

  const keys: PublicKey[] = [];
  for (const l of launches) {
    const creator = new PublicKey(l.wallet);
    const mint = new PublicKey(l.mint);
    keys.push(creator, curveVault(creator), ammVault(creator), bondingCurve(mint), canonicalPool(mint));
  }

  const connection = connect();
  const infos: (AccountInfo<Buffer> | null)[] = [];
  for (let i = 0; i < keys.length; i += 100) {
    infos.push(...(await connection.getMultipleAccountsInfo(keys.slice(i, i + 100))));
  }

  launches.forEach((l, n) => {
    const [wallet, vault, ammAta, curve, pool] = infos.slice(n * 5, n * 5 + 5);
    const shared =
      (vault ? Math.max(vault.lamports - EMPTY_RENT, 0) : 0) + u64(ammAta, 64); // token account amount
    const own = u64(curve, CURVE_CREATOR_FEE) + u64(pool, POOL_CREATOR_FEES);
    out.set(l.mint, {
      walletLamports: wallet?.lamports ?? 0,
      sharedLamports: shared,
      ownLamports: own,
      uncollectedLamports: shared + own,
    });
  });
  return out;
}

/** Below this, collecting would cost more in fees than it brings in */
export const MIN_COLLECT_LAMPORTS = 100_000;

/**
 * Sweeps and collects every creator fee of one coin into its launch wallet
 *
 * One transaction, signed and paid for by the launch wallet itself. Returns
 * null when there was nothing on chain to collect from
 */
export async function collectCreatorFees(creator: Keypair, mint: string) {
  const connection = connect();
  const ixs = await collectInstructions(connection, creator.publicKey, new PublicKey(mint));
  if (ixs.length === 0) return null;

  const latest = await connection.getLatestBlockhash("confirmed");
  const message = new TransactionMessage({
    payerKey: creator.publicKey,
    recentBlockhash: latest.blockhash,
    instructions: [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50_000 }),
      ...ixs,
    ],
  }).compileToV0Message();
  const tx = new VersionedTransaction(message);
  tx.sign([creator]);

  const signature = await connection.sendTransaction(tx, { maxRetries: 3 });
  const result = await connection.confirmTransaction(
    { signature, blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight },
    "confirmed",
  );
  if (result.value.err) {
    throw new Error(`Collecting failed on chain: ${JSON.stringify(result.value.err)}`);
  }
  return signature;
}
