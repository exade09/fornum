import "server-only";
import { randomUUID } from "node:crypto";
import { PublicKey, VersionedTransaction, type ParsedInstruction } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { connect } from "@/lib/solana/read";
import { fetchReceipt } from "@/lib/solana/receipt";
import { buybackConfig, onExpectedCluster, seal, unseal } from "@/lib/buyback/config";
import {
  closeJob,
  leaseJob,
  markSigned,
  markSubmitted,
  networkSpentToday,
  noteCredit,
  noteJob,
  openJob,
  pendingCredits,
  releaseLease,
  reserveJob,
  settleCredit,
  type Job,
} from "@/lib/buyback/ledger";
import { inspectMint, programsReady, signBuyback } from "@/lib/buyback/market";
import { scanDistributions } from "@/lib/buyback/scan";
import { distributeAll, feesEnabled } from "@/lib/buyback/distribute-all";
import { expired, judgeBuybackReceipt, judgeCreditReceipt, nextBudget } from "@/lib/buyback/rules";

/**
 * The buyback worker
 *
 * There is no long running process on this host, so the worker runs in short
 * passes: after a claim answers, from the button on /admin and from a daily
 * cron. Every pass picks up wherever the last one stopped, because every step
 * is written down before the next one starts:
 *
 *   credits:  claim receipt finalized -> credit confirmed (or manual review)
 *   job:      reserved -> signed and sealed -> sent -> finalized or failed
 *
 * A job whose result is unknown is never replaced by a new buy: the worker
 * asks about its signature, sends the same bytes again while they can still
 * land, and closes it only on a finalized receipt or once its blockhash has
 * expired. BUYBACK_ENABLED off stops new jobs and sends, never reconciling
 */

export type PassLog = { at: string; step: string; detail?: string };

function logger() {
  const log: PassLog[] = [];
  const push = (step: string, detail?: string) => {
    log.push({ at: new Date().toISOString(), step, detail });
    console.info(`[buyback] ${step}${detail ? `: ${detail}` : ""}`);
  };
  return { log, push };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ */
/* Credits                                                             */
/* ------------------------------------------------------------------ */

async function reconcileCredits(push: (s: string, d?: string) => void) {
  for (const c of await pendingCredits()) {
    try {
      const tx = await fetchReceipt(c.signature, "finalized");
      if (!tx) {
        // not final yet, or the archive does not have it: keep it pending, never guess
        continue;
      }
      const verdict = judgeCreditReceipt({
        err: tx.err,
        accountKeys: tx.accountKeys,
        preBalances: tx.preBalances,
        postBalances: tx.postBalances,
        treasury: c.treasury,
        expectedLamports: c.expectedLamports,
      });
      await settleCredit(c.id, verdict);
      push(`credit ${verdict.kind}`, `${c.signature} ${verdict.kind === "confirmed" ? verdict.lamports : verdict.reason}`);
    } catch (err) {
      await noteCredit(c.id, `read failed: ${err instanceof Error ? err.message : String(err)}`).catch(() => {});
    }
  }
}

/* ------------------------------------------------------------------ */
/* Jobs                                                                */
/* ------------------------------------------------------------------ */

/** Reads the finalized receipt of a job's transaction and closes the job */
async function settleFromReceipt(job: Job, owner: string, push: (s: string, d?: string) => void) {
  const connection = connect();
  const tx = await fetchReceipt(job.signature!, "finalized");
  if (!tx) return false;

  const keys = tx.accountKeys;
  const treasuryAt = keys.indexOf(job.treasury);
  const mint = new PublicKey(job.mainMint);
  const facts = await inspectMint(connection, job.mainMint);
  const ata = getAssociatedTokenAddressSync(mint, new PublicKey(job.treasury), false, facts.tokenProgram).toBase58();
  const ataAt = keys.indexOf(ata);

  const tokenAt = (list: typeof tx.preTokenBalances) =>
    BigInt(list.find((b) => b.accountIndex === ataAt && b.mint === job.mainMint)?.uiTokenAmount.amount ?? "0");

  const burns = tx.instructions
    .filter((ix) => ix.parsed?.type === "burnChecked" || ix.parsed?.type === "burn")
    .map((ix) => (ix.parsed!.info ?? {}) as Record<string, any>)
    .filter((info) => info.mint === job.mainMint && info.authority === job.treasury)
    .map((info) => BigInt(info.tokenAmount?.amount ?? info.amount));

  const verdict = judgeBuybackReceipt({
    err: tx.err,
    treasuryPre: tx.preBalances[treasuryAt],
    treasuryPost: tx.postBalances[treasuryAt],
    feeLamports: tx.fee,
    openedAccounts: job.openedAccounts.map((a) => {
      const i = keys.indexOf(a);
      return i < 0 ? { pre: 0, post: 0 } : { pre: tx.preBalances[i], post: tx.postBalances[i] };
    }),
    ataPreTokens: tokenAt(tx.preTokenBalances),
    ataPostTokens: tokenAt(tx.postTokenBalances),
    burns,
    expectedTokens: BigInt(job.tokenAmount ?? "0"),
    reservedLamports: job.reservedLamports,
  });

  if (treasuryAt !== 0) {
    await closeJob(job.id, owner, { state: "failed", error: "the treasury was not the fee payer" });
    push("job failed", `${job.signature} the treasury was not the fee payer`);
    return true;
  }
  if (verdict.kind === "finalized") {
    await closeJob(job.id, owner, {
      state: "finalized",
      marketLamports: verdict.marketSpentLamports,
      networkLamports: verdict.networkLamports,
      burnedAmount: verdict.burned.toString(),
      note: verdict.notes.join("; ") || undefined,
    });
    push(
      "job finalized",
      `${job.signature} market ${verdict.marketSpentLamports} of ${job.reservedLamports}, network ${verdict.networkLamports}, burned ${verdict.burned}`,
    );
  } else {
    await closeJob(job.id, owner, { state: "failed", error: verdict.reason });
    push("job failed", `${job.signature} ${verdict.reason}`);
  }
  return true;
}

/**
 * Moves one job as far as it can go before the deadline
 *
 * prepared: signs and seals it, or gives its budget back when the checks
 * refuse. signed/submitted: asks about the signature, settles a finalized
 * receipt, fails an expired one, otherwise sends the same bytes again
 */
async function advance(job: Job, owner: string, deadline: number, push: (s: string, d?: string) => void) {
  const { settings, problems, treasuryKey } = buybackConfig();
  const connection = connect();

  if (job.state === "prepared") {
    if (!settings.enabled || problems.length > 0 || !treasuryKey) {
      await closeJob(job.id, owner, {
        state: "failed",
        error: settings.enabled ? `blocked: ${problems.join("; ")}` : "BUYBACK_ENABLED is off, released before signing",
      });
      push("job released", job.id);
      return;
    }
    try {
      if (!(await onExpectedCluster())) throw new Error("The RPC is not on the expected cluster");
      if (!(await programsReady(connection))) throw new Error("The pump programs are not available");
      const signed = await signBuyback(
        connection,
        treasuryKey,
        job.mainMint,
        job.reservedLamports,
        settings,
        await networkSpentToday(),
      );
      const sealed = seal(signed.tx.serialize());
      await markSigned(job.id, owner, {
        market: signed.plan.market,
        maxQuoteLamports: signed.plan.maxQuoteLamports,
        tokenAmount: signed.plan.tokenAmount.toString(),
        decimals: signed.decimals,
        signature: signed.signature,
        signedTx: sealed,
        lastValidBlockHeight: signed.lastValidBlockHeight,
        expectedNetworkLamports: signed.expectedNetworkLamports,
        openedAccounts: signed.openedAccounts,
      });
      push(
        "simulated and signed",
        `${signed.signature} ${signed.plan.market}, buy ${signed.plan.tokenAmount} for at most ${signed.plan.maxQuoteLamports}, simulated ${signed.simulatedMarketLamports}, network ${signed.expectedNetworkLamports}`,
      );
      job = {
        ...job,
        state: "signed",
        signature: signed.signature,
        signedTx: sealed,
        lastValidBlockHeight: signed.lastValidBlockHeight,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      await closeJob(job.id, owner, { state: "failed", error: `not sent: ${error}` });
      push("job refused", error);
      return;
    }
  }

  // signed or submitted from here on: the bytes are stored, the outcome is what the chain says
  while (Date.now() < deadline) {
    const fresh = await leaseJob(job.id, owner);
    if (!fresh) return;
    job = fresh;

    const { value } = await connection.getSignatureStatuses([job.signature!], { searchTransactionHistory: true });
    const status = value[0];
    if (status?.confirmationStatus === "finalized") {
      if (await settleFromReceipt(job, owner, push)) return;
    } else if (status?.err) {
      // failed at a lower commitment: wait for finality before giving the budget back
      push("job failing", `${job.signature} ${JSON.stringify(status.err)}, waiting for finality`);
    } else if (!status) {
      const height = await connection.getBlockHeight("finalized");
      if (expired(height, job.lastValidBlockHeight ?? 0)) {
        await closeJob(job.id, owner, { state: "failed", error: "never landed, blockhash expired" });
        push("job expired", job.signature!);
        return;
      }
      if (settings.enabled) {
        try {
          const tx = VersionedTransaction.deserialize(unseal(job.signedTx!));
          await connection.sendRawTransaction(tx.serialize(), { skipPreflight: true, maxRetries: 0 });
          await markSubmitted(job.id, owner);
          push(job.state === "signed" ? "submitted" : "sent again", job.signature!);
          job.state = "submitted";
        } catch (err) {
          // an unknown answer is not a failure: the signature decides
          await noteJob(job.id, `send: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }
    await sleep(4_000);
  }
}

/**
 * One pass: confirm credits, move the open job, and start a new one when the
 * ledger allows it, all before `budgetMs` runs out
 */
export async function runBuybackPass(budgetMs = 45_000) {
  const deadline = Date.now() + budgetMs;
  const owner = randomUUID();
  const { log, push } = logger();
  const { settings, problems, treasuryKey } = buybackConfig();

  try {
    // pump.fun distributions first, so this pass can already read what they paid
    if (feesEnabled() && treasuryKey && problems.length === 0) {
      await distributeAll(treasuryKey, push, deadline - 20_000).catch((err) =>
        push("distribute failed", err instanceof Error ? err.message : String(err)),
      );
    }
    await reconcileCredits(push);
    await scanDistributions(push, deadline - 15_000).catch((err) =>
      push("scan failed", err instanceof Error ? err.message : String(err)),
    );

    let job = await openJob();
    if (!job && settings.enabled && problems.length === 0 && treasuryKey && settings.mainMint) {
      job = await reserveJob({
        treasury: settings.treasuryWallet!,
        mainMint: settings.mainMint,
        budgetFor: (available) => nextBudget(available, settings),
      });
      if (job) push("budget reserved", `${job.id} ${job.reservedLamports}`);
    }
    if (!job) {
      if (problems.length > 0 && settings.enabled) push("blocked", problems.join("; "));
      return { log };
    }

    const leased = await leaseJob(job.id, owner);
    if (!leased) {
      push("busy", "another worker holds the open job");
      return { log };
    }
    try {
      await advance(leased, owner, deadline, push);
    } finally {
      await releaseLease(job.id, owner).catch(() => {});
    }
  } catch (err) {
    push("pass failed", err instanceof Error ? err.message : String(err));
  }
  return { log };
}
