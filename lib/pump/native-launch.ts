import "server-only";
import { Keypair, PublicKey } from "@solana/web3.js";
import { connect } from "@/lib/solana/read";
import { launchWalletAddress } from "@/lib/solana/wallet";
import { treasuryWallet } from "@/lib/buyback/config";
import { launchPolicy, type SharePolicy } from "@/lib/pump/share-rules";
import { signLaunch, verifiedLaunchTable, verifyShares } from "@/lib/pump/shares";
import { getPolicy, launchTableAddress, markPolicy, savePolicy } from "@/lib/pump/policies";

/**
 * Launching a coin with its 80/20 split locked on chain
 *
 * In order: the policy is worked out and refused if anything about it is off,
 * the lookup table is checked, the policy is stored under the new mint, the
 * transaction is signed and simulated (and refused unless the simulation
 * already shows the split), sent, and then the split is checked again on the
 * finalized chain. Only a coin whose finalized state matches the policy is
 * marked verified; until then its fees are not paid out
 */

export type NativeLaunch = {
  mint: string;
  signature: string;
  verified: boolean;
  problems: string[];
  costLamports: number;
};

/** Why a launch with the split cannot happen right now, or null when it can */
export async function nativeLaunchProblem(): Promise<string | null> {
  const treasury = treasuryWallet();
  if (!treasury) return "TREASURY_WALLET is not set, so the 20% has nowhere to go";
  const table = await launchTableAddress();
  if (!table) return "There is no launch lookup table yet, create it in Fee split on /admin";
  return null;
}

export async function launchWithShares(input: {
  creator: Keypair;
  name: string;
  symbol: string;
  uri: string;
}): Promise<NativeLaunch> {
  const connection = connect();
  const treasury = treasuryWallet();
  const decided = launchPolicy({
    developer: input.creator.publicKey.toBase58(),
    treasury,
    sponsor: launchWalletAddress(),
  });
  if ("problem" in decided) throw new Error(decided.problem);
  const policy = decided.policy;

  const tableAddress = await launchTableAddress();
  if (!tableAddress) throw new Error("There is no launch lookup table yet, create it in Fee split on /admin");
  const table = await verifiedLaunchTable(connection, tableAddress, new PublicKey(policy.treasury));

  const mint = Keypair.generate();
  await savePolicy(mint.publicKey.toBase58(), policy);

  let signed;
  try {
    signed = await signLaunch({ ...input, connection, policy, table, mint });
  } catch (err) {
    await markPolicy(mint.publicKey.toBase58(), "failed", { error: err instanceof Error ? err.message : String(err) });
    throw err;
  }

  await markPolicy(signed.mint.publicKey.toBase58(), "submitted", { signature: signed.signature });
  await connection.sendRawTransaction(signed.tx.serialize(), { skipPreflight: true, maxRetries: 3 });
  const confirmed = await connection.confirmTransaction(
    { signature: signed.signature, blockhash: signed.blockhash, lastValidBlockHeight: signed.lastValidBlockHeight },
    "confirmed",
  );
  if (confirmed.value.err) {
    await markPolicy(signed.mint.publicKey.toBase58(), "failed", { error: JSON.stringify(confirmed.value.err) });
    throw new Error(`The launch failed on chain: ${JSON.stringify(confirmed.value.err)}`);
  }

  const mintAddress = signed.mint.publicKey.toBase58();
  const check = await checkLaunch(mintAddress, policy, 25_000);
  return {
    mint: mintAddress,
    signature: signed.signature,
    verified: check.verified,
    problems: check.problems,
    costLamports: signed.simulatedCostLamports,
  };
}

/**
 * Waits up to `waitMs` for the launch to be final and checks its split there.
 * A launch that is not final yet stays submitted, to be checked again later
 */
export async function checkLaunch(mint: string, policy: SharePolicy, waitMs = 0) {
  const connection = connect();
  const until = Date.now() + waitMs;
  for (;;) {
    const problems = await verifyShares(connection, mint, policy, "finalized");
    if (problems.length === 0) {
      await markPolicy(mint, "verified");
      return { verified: true, problems };
    }
    const notFinal = problems.length === 1 && problems[0].includes("not on chain yet");
    if (!notFinal) {
      await markPolicy(mint, "failed", { error: problems.join("; ") });
      return { verified: false, problems };
    }
    if (Date.now() > until) return { verified: false, problems };
    await new Promise((r) => setTimeout(r, 3_000));
  }
}

/** Checks a coin recorded as pending against the policy stored for it */
export async function recheckLaunch(mint: string) {
  const policy = await getPolicy(mint);
  if (!policy) return { verified: false, problems: ["no policy is stored for this coin"] };
  return checkLaunch(mint, policy, 0);
}
