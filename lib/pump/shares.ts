import "server-only";
import {
  AddressLookupTableProgram,
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  type AddressLookupTableAccount,
  type Connection,
  type TransactionInstruction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { NATIVE_MINT, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  PUMP_FEE_PROGRAM_ID,
  PUMP_PROGRAM_ID,
  PUMP_SDK,
  bondingCurvePda,
  canonicalPumpPoolPda,
  feeSharingConfigPda,
} from "@pump-fun/pump-sdk";
import { PUMP_AMM_SDK } from "@pump-fun/pump-swap-sdk";
import { sharingProblems, type SharePolicy, type SharingFacts } from "@/lib/pump/share-rules";

/**
 * A coin created with its fee split locked on chain, in one transaction
 *
 *   1. create_v2: the mint and its bonding curve, the launch wallet as creator
 *   2. create_fee_sharing_config: a sharing config for the mint, which takes
 *      over as the coin's creator, 10 000 bps to the launch wallet
 *   3. update_fee_shares_v2: launch wallet 8 000, treasury 2 000, which also
 *      revokes the admin, so nobody can change the split again
 *
 * If any of the three fails, none happens: there is never a coin without its
 * split. The three do not fit in a plain transaction, so the accounts every
 * launch shares sit in an address lookup table the treasury owns, created once
 * from /admin and checked before every use
 */

const COMPUTE_UNITS = 400_000;
const PRIORITY_MICROLAMPORTS = 100_000;
const MAX_U64 = BigInt("18446744073709551615");

/** The three instructions, for real or for a template */
export async function launchInstructions(input: {
  creator: PublicKey;
  mint: PublicKey;
  policy: SharePolicy;
  name: string;
  symbol: string;
  uri: string;
}): Promise<TransactionInstruction[]> {
  return [
    ComputeBudgetProgram.setComputeUnitLimit({ units: COMPUTE_UNITS }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: PRIORITY_MICROLAMPORTS }),
    await PUMP_SDK.createV2Instruction({
      mint: input.mint,
      name: input.name,
      symbol: input.symbol,
      uri: input.uri,
      creator: input.creator,
      user: input.creator,
      mayhemMode: false,
    }),
    await PUMP_SDK.createFeeSharingConfig({ creator: input.creator, mint: input.mint, pool: null }),
    await PUMP_SDK.updateFeeSharesV2({
      authority: input.creator,
      mint: input.mint,
      // a new config starts with the creator alone at 10 000 bps
      currentShareholders: [input.creator],
      newShareholders: input.policy.shareholders.map((s) => ({
        address: new PublicKey(s.address),
        shareBps: s.shareBps,
      })),
      quoteMint: NATIVE_MINT,
      quoteTokenProgram: TOKEN_PROGRAM_ID,
      bondingCurveComplete: false,
    }),
  ];
}

/**
 * Accounts every launch uses whoever launches and whatever the coin: the ones
 * two launches with different creators and mints have in common, less the
 * signers and the programs called at the top level (those must stay in the
 * transaction itself)
 */
export async function sharedLaunchAccounts(treasury: PublicKey): Promise<PublicKey[]> {
  const sample = async () => {
    const creator = Keypair.generate().publicKey;
    const ixs = await launchInstructions({
      creator,
      mint: Keypair.generate().publicKey,
      policy: {
        developer: creator.toBase58(),
        treasury: treasury.toBase58(),
        shareholders: [
          { address: creator.toBase58(), shareBps: 8_000 },
          { address: treasury.toBase58(), shareBps: 2_000 },
        ],
      },
      name: "x",
      symbol: "x",
      uri: "x",
    });
    const m = new TransactionMessage({
      payerKey: creator,
      recentBlockhash: PublicKey.default.toBase58(),
      instructions: ixs,
    }).compileToV0Message();
    const invoked = new Set(m.compiledInstructions.map((ix) => m.staticAccountKeys[ix.programIdIndex].toBase58()));
    return m.staticAccountKeys
      .slice(m.header.numRequiredSignatures)
      .map((k) => k.toBase58())
      .filter((k) => !invoked.has(k));
  };
  const [a, b] = [await sample(), await sample()];
  return a.filter((k) => b.includes(k)).map((k) => new PublicKey(k));
}

/** One transaction that opens the table and fills it. The table is usable once it is final */
export async function createLaunchTable(connection: Connection, treasuryKey: Keypair) {
  const recentSlot = await connection.getSlot("finalized");
  const [create, table] = AddressLookupTableProgram.createLookupTable({
    authority: treasuryKey.publicKey,
    payer: treasuryKey.publicKey,
    recentSlot,
  });
  const extend = AddressLookupTableProgram.extendLookupTable({
    lookupTable: table,
    authority: treasuryKey.publicKey,
    payer: treasuryKey.publicKey,
    addresses: await sharedLaunchAccounts(treasuryKey.publicKey),
  });
  const latest = await connection.getLatestBlockhash("finalized");
  const tx = new VersionedTransaction(
    new TransactionMessage({
      payerKey: treasuryKey.publicKey,
      recentBlockhash: latest.blockhash,
      instructions: [create, extend],
    }).compileToV0Message(),
  );
  tx.sign([treasuryKey]);
  const sim = await connection.simulateTransaction(tx, { sigVerify: true });
  if (sim.value.err) throw new Error(`The lookup table would not be created: ${JSON.stringify(sim.value.err)}`);
  const signature = await connection.sendTransaction(tx, { maxRetries: 3 });
  const done = await connection.confirmTransaction(
    { signature, blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight },
    "finalized",
  );
  if (done.value.err) throw new Error(`The lookup table failed: ${JSON.stringify(done.value.err)}`);
  return { table: table.toBase58(), signature };
}

/**
 * The launch table, after checking it at finalized commitment: the treasury
 * is its authority, it is not being deactivated, it holds every shared
 * account, and nothing was added to it in the current slot
 */
export async function verifiedLaunchTable(
  connection: Connection,
  address: string,
  treasury: PublicKey,
): Promise<AddressLookupTableAccount> {
  const { value } = await connection.getAddressLookupTable(new PublicKey(address), { commitment: "finalized" });
  if (!value) throw new Error("The launch lookup table does not exist, or is not final yet");
  if (!value.state.authority?.equals(treasury)) throw new Error("The launch lookup table belongs to someone else");
  if (value.state.deactivationSlot !== MAX_U64) throw new Error("The launch lookup table is being deactivated");
  const have = new Set(value.state.addresses.map((a) => a.toBase58()));
  const missing = (await sharedLaunchAccounts(treasury)).filter((k) => !have.has(k.toBase58()));
  if (missing.length > 0) throw new Error(`The launch lookup table is missing ${missing.length} accounts, make it again`);
  const slot = await connection.getSlot("finalized");
  if (BigInt(value.state.lastExtendedSlot) >= BigInt(slot)) throw new Error("The launch lookup table is still warming up");
  return value;
}

/** Reads the coin's sharing state, from the chain or from simulated accounts */
export function sharingFacts(input: {
  mint: PublicKey;
  mintOwner: PublicKey;
  sharing: { owner: PublicKey; data: Buffer; lamports: number };
  curve: { owner: PublicKey; data: Buffer; lamports: number };
  poolCoinCreator: PublicKey | null;
}): SharingFacts {
  const asInfo = (a: { owner: PublicKey; data: Buffer; lamports: number }) => ({
    ...a,
    executable: false,
    rentEpoch: 0,
  });
  const config = PUMP_SDK.decodeSharingConfig(asInfo(input.sharing));
  const curve = PUMP_SDK.decodeBondingCurve(asInfo(input.curve));
  return {
    sharingOwner: input.sharing.owner.toBase58(),
    feesProgram: PUMP_FEE_PROGRAM_ID.toBase58(),
    version: config.version,
    mint: config.mint.toBase58(),
    expectedMint: input.mint.toBase58(),
    adminRevoked: config.adminRevoked,
    shareholders: config.shareholders.map((s) => ({ address: s.address.toBase58(), shareBps: s.shareBps })),
    curveOwner: input.curve.owner.toBase58(),
    pumpProgram: PUMP_PROGRAM_ID.toBase58(),
    curveCreator: curve.creator.toBase58(),
    sharingAddress: feeSharingConfigPda(input.mint).toBase58(),
    curveComplete: curve.complete,
    poolCoinCreator: input.poolCoinCreator?.toBase58() ?? null,
    mintOwner: input.mintOwner.toBase58(),
    tokenPrograms: [TOKEN_PROGRAM_ID.toBase58(), TOKEN_2022_PROGRAM_ID.toBase58()],
  };
}

export type SignedLaunch = {
  tx: VersionedTransaction;
  mint: Keypair;
  signature: string;
  blockhash: string;
  lastValidBlockHeight: number;
  /** lamports the launch wallet spent in the simulation */
  simulatedCostLamports: number;
};

/**
 * Builds, signs and simulates the launch, and refuses it unless the
 * simulated accounts already show the policy in place
 */
export async function signLaunch(input: {
  connection: Connection;
  creator: Keypair;
  policy: SharePolicy;
  table: AddressLookupTableAccount;
  /** made by the caller, so the policy can be stored under it before signing */
  mint: Keypair;
  name: string;
  symbol: string;
  uri: string;
}): Promise<SignedLaunch> {
  const { connection, creator, mint } = input;
  if (creator.publicKey.toBase58() !== input.policy.developer) throw new Error("The signer is not the policy's developer");
  const ixs = await launchInstructions({
    creator: creator.publicKey,
    mint: mint.publicKey,
    policy: input.policy,
    name: input.name,
    symbol: input.symbol,
    uri: input.uri,
  });
  const latest = await connection.getLatestBlockhash("finalized");
  const tx = new VersionedTransaction(
    new TransactionMessage({
      payerKey: creator.publicKey,
      recentBlockhash: latest.blockhash,
      instructions: ixs,
    }).compileToV0Message([input.table]),
  );
  tx.sign([creator, mint]);
  if (tx.serialize().length > 1232) throw new Error("The launch transaction is too large even with the lookup table");

  const sharing = feeSharingConfigPda(mint.publicKey);
  const curve = bondingCurvePda(mint.publicKey);
  const before = await connection.getBalance(creator.publicKey, "confirmed");
  const sim = await connection.simulateTransaction(tx, {
    sigVerify: true,
    commitment: "confirmed",
    accounts: {
      encoding: "base64",
      addresses: [sharing, curve, mint.publicKey, creator.publicKey].map((k) => k.toBase58()),
    },
  });
  if (sim.value.err) {
    throw new Error(`The launch simulation failed: ${JSON.stringify(sim.value.err)} ${(sim.value.logs ?? []).slice(-3).join(" | ")}`);
  }
  const [s, c, m, w] = sim.value.accounts ?? [];
  if (!s || !c || !m || !w) throw new Error("The simulation did not return the new accounts");
  const raw = (a: NonNullable<typeof s>) => ({
    owner: new PublicKey(a.owner),
    data: Buffer.from(a.data[0], "base64"),
    lamports: a.lamports,
  });
  const problems = sharingProblems(
    sharingFacts({
      mint: mint.publicKey,
      mintOwner: new PublicKey(m.owner),
      sharing: raw(s),
      curve: raw(c),
      poolCoinCreator: null,
    }),
    input.policy,
  );
  if (problems.length > 0) throw new Error(`The simulated split is not the policy: ${problems.join("; ")}`);

  return {
    tx,
    mint,
    signature: bs58.encode(tx.signatures[0]),
    blockhash: latest.blockhash,
    lastValidBlockHeight: latest.lastValidBlockHeight,
    simulatedCostLamports: before - w.lamports,
  };
}

/**
 * Checks a coin's split on chain at the given commitment
 *
 * Empty means the coin is exactly the policy: owned by the right programs, the
 * config for this mint, version 2 with the admin revoked, the curve (and the
 * pool, once graduated) paying the config, and the two shareholders at 8 000
 * and 2 000 bps
 */
export async function verifyShares(
  connection: Connection,
  mintAddress: string,
  policy: SharePolicy,
  commitment: "confirmed" | "finalized" = "finalized",
): Promise<string[]> {
  const mint = new PublicKey(mintAddress);
  const sharing = feeSharingConfigPda(mint);
  const pool = canonicalPumpPoolPda(mint);
  const [m, s, c, p] = await connection.getMultipleAccountsInfo(
    [mint, sharing, bondingCurvePda(mint), pool],
    commitment,
  );
  if (!m || !s || !c) return ["the mint, the sharing config or the curve is not on chain yet"];
  let poolCreator: PublicKey | null = null;
  if (p) {
    try {
      poolCreator = PUMP_AMM_SDK.decodePool(p).coinCreator;
    } catch {
      return ["the canonical pool could not be read"];
    }
  }
  return sharingProblems(
    sharingFacts({ mint, mintOwner: m.owner, sharing: s, curve: c, poolCoinCreator: poolCreator }),
    policy,
  );
}
