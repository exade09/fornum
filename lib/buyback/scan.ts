import "server-only";
import { PublicKey, type ParsedInstruction, type PartiallyDecodedInstruction } from "@solana/web3.js";
import bs58 from "bs58";
import { PUMP_AMM_PROGRAM_ID, PUMP_FEE_PROGRAM_ID, PUMP_PROGRAM_ID, feeSharingConfigPda } from "@pump-fun/pump-sdk";
import { connect } from "@/lib/solana/read";
import { listTokens, scanCursor, setFeeSharing, setScanCursor } from "@/lib/db/store";
import { getPolicy } from "@/lib/pump/policies";
import { recheckLaunch } from "@/lib/pump/native-launch";
import { judgeDistribution } from "@/lib/pump/share-rules";
import { recordDistributionCredit } from "@/lib/buyback/ledger";

/**
 * Reads every distribution of every native coin into the treasury ledger
 *
 * pump.fun's distribution is permissionless, so the treasury's 20% can arrive
 * in a transaction somebody else sent. Each coin's sharing config is followed
 * from the last signature read (or from its launch), finalized only, oldest
 * first; each transaction is judged on its own receipt and recorded once by
 * its signature. A transaction that is not a plain distribution goes to
 * manual review rather than being guessed. The cursor moves only past what
 * was read, so an RPC that cannot serve old history leaves it where it was
 */

const DISTRIBUTE = new Set(["a572670079cef751", "ffcb134ff444089f"]);
const COMPUTE_BUDGET = "ComputeBudget111111111111111111111111111111";
const ATA = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
const ALLOWED = new Set([
  COMPUTE_BUDGET,
  ATA,
  PUMP_PROGRAM_ID.toBase58(),
  PUMP_AMM_PROGRAM_ID.toBase58(),
  PUMP_FEE_PROGRAM_ID.toBase58(),
]);

type Ix = ParsedInstruction | PartiallyDecodedInstruction;

function isDistribute(ix: Ix, sharing: string) {
  if (!("data" in ix) || !ix.programId.equals(PUMP_PROGRAM_ID)) return false;
  const disc = Buffer.from(bs58.decode(ix.data)).subarray(0, 8).toString("hex");
  return DISTRIBUTE.has(disc) && ix.accounts.some((a) => a.toBase58() === sharing);
}

/** Lamports the system program moved out of each address, top level and inner */
function systemOutflows(all: Ix[]) {
  const out: Record<string, number> = {};
  for (const ix of all) {
    if (!("parsed" in ix) || ix.program !== "system") continue;
    const info = ix.parsed?.info ?? {};
    const lamports = Number(info.lamports ?? 0);
    const from = info.source ?? info.fundingAccount;
    if (from && lamports > 0) out[from] = (out[from] ?? 0) + lamports;
  }
  return out;
}

export async function scanDistributions(push: (step: string, detail?: string) => void, deadline: number) {
  const connection = connect();
  for (const t of await listTokens()) {
    if (Date.now() > deadline) return;
    if (!t.feeSharing) continue;

    // a coin whose split is not verified yet is checked first, and skipped until it is
    if (t.feeSharing !== "native") {
      const check = await recheckLaunch(t.mint).catch(() => null);
      if (!check?.verified) continue;
      await setFeeSharing(t.id, "native");
      push("split verified", t.id);
    }

    const policy = await getPolicy(t.mint);
    if (!policy) {
      push("no policy", t.id);
      continue;
    }
    const sharing = feeSharingConfigPda(new PublicKey(t.mint)).toBase58();
    const until = (await scanCursor(t.id)) ?? policy.signature ?? undefined;
    // every signature after the cursor, page by page back to it; if the whole
    // range cannot be read in time, nothing is read so no gap is left behind
    const sigs: { signature: string }[] = [];
    let complete = false;
    try {
      let before: string | undefined;
      while (Date.now() < deadline) {
        const page = await connection.getSignaturesForAddress(
          new PublicKey(sharing),
          { until, before, limit: 1000 },
          "finalized",
        );
        sigs.push(...page);
        if (page.length < 1000) {
          complete = true;
          break;
        }
        before = page[page.length - 1].signature;
      }
    } catch (err) {
      push("scan unavailable", `${t.id} ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }
    if (!complete) continue;
    let newest: string | null = null;
    // the RPC answers newest first; read oldest first and stop at the first gap
    for (const s of [...sigs].reverse()) {
      if (Date.now() > deadline) break;
      const tx = await connection
        .getParsedTransaction(s.signature, { commitment: "finalized", maxSupportedTransactionVersion: 0 })
        .catch(() => null);
      if (!tx?.meta) break;
      const top = tx.transaction.message.instructions as Ix[];
      const inner = (tx.meta.innerInstructions ?? []).flatMap((x) => x.instructions as Ix[]);
      const topDist = top.filter((ix) => isDistribute(ix, sharing)).length;
      if (topDist === 0 && !inner.some((ix) => isDistribute(ix, sharing))) {
        newest = s.signature; // not a distribution, nothing to record
        continue;
      }
      const verdict = judgeDistribution({
        err: tx.meta.err,
        accountKeys: tx.transaction.message.accountKeys.map((k) => k.pubkey.toBase58()),
        preBalances: tx.meta.preBalances,
        postBalances: tx.meta.postBalances,
        feeLamports: tx.meta.fee,
        developer: policy.developer,
        treasury: policy.treasury,
        topLevelDistributes: topDist,
        innerDistributes: inner.filter((ix) => isDistribute(ix, sharing)).length,
        unexpectedPrograms: top.map((ix) => ix.programId.toBase58()).filter((p) => !ALLOWED.has(p)),
        systemOutflows: systemOutflows([...top, ...inner]),
      });
      await recordDistributionCredit({
        tokenId: t.id,
        mint: t.mint,
        signature: s.signature,
        treasury: policy.treasury,
        mainMint: null,
        state: verdict.kind,
        lamports: verdict.kind === "confirmed" ? verdict.treasuryLamports : 0,
        note: verdict.kind === "confirmed" ? null : verdict.reason,
      });
      push(`distribution ${verdict.kind}`, `${t.id} ${s.signature} ${verdict.kind === "confirmed" ? verdict.treasuryLamports : verdict.reason}`);
      newest = s.signature;
    }
    if (newest) await setScanCursor(t.id, newest);
  }
}
