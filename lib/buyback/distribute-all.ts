import "server-only";
import { randomUUID } from "node:crypto";
import { PublicKey } from "@solana/web3.js";
import { OnlinePumpSdk } from "@pump-fun/pump-sdk";
import { connect } from "@/lib/solana/read";
import { acquireClaimLock, listTokens, releaseClaimLock } from "@/lib/db/store";
import { distributeNative } from "@/lib/pump/distribute";
import type { Keypair } from "@solana/web3.js";

/**
 * pump.fun distributions for every coin with the split locked on chain
 *
 * With FEES_ENABLED on, each pass sends a distribution for every native coin
 * whose waiting creator fees reached FEE_MIN_CLAIM_LAMPORTS (and the
 * program's own minimum): 80% lands on the coin's launch wallet for its
 * owner, 20% on the treasury, which pays the network fee. The amount is
 * checked when the coin is picked and again by the program when the
 * transaction runs. One distribution per coin at a time, under the same lock
 * a claim takes. What reached the treasury is read from the finalized receipt
 * by the scanner, never assumed from here
 */

export function feesEnabled() {
  return process.env.FEES_ENABLED?.trim().toLowerCase() === "true";
}

export function minClaimLamports() {
  // no threshold unless one is set: pump.fun's own minimum decides
  const v = Number(process.env.FEE_MIN_CLAIM_LAMPORTS ?? "0");
  return Number.isSafeInteger(v) && v >= 0 ? v : 0;
}

export async function distributeAll(
  treasuryKey: Keypair,
  push: (step: string, detail?: string) => void,
  deadline: number,
) {
  const sdk = new OnlinePumpSdk(connect());
  for (const t of await listTokens()) {
    if (Date.now() > deadline) return;
    if (t.feeSharing !== "native") continue;
    try {
      const min = await sdk.getMinimumDistributableFee(new PublicKey(t.mint), treasuryKey.publicKey, {
        payer: treasuryKey.publicKey,
      });
      if (!min.canDistribute || min.distributableFees.toNumber() < minClaimLamports()) continue;
    } catch (err) {
      push("distribution check failed", `${t.id} ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }
    const owner = randomUUID();
    if (!(await acquireClaimLock(t.id, owner))) continue;
    try {
      const sig = await distributeNative(t.mint, treasuryKey);
      if (sig) push("distributed", `${t.id} ${sig}`);
    } catch (err) {
      push("distribution failed", `${t.id} ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      await releaseClaimLock(t.id, owner).catch(() => {});
    }
  }
}
