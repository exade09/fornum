import "server-only";
import { randomUUID } from "node:crypto";
import { sql } from "@/lib/db/client";
import { ensureSchema } from "@/lib/db/migrate";
import { allocate, releaseFrom, type Allocation, type CreditVerdict } from "@/lib/buyback/rules";

/**
 * The treasury ledger and the buyback jobs, in Postgres
 *
 * Only what a finalized claim receipt shows reaching the treasury is ever
 * spent. A job reserves its budget from those credits inside one transaction
 * under an advisory lock, and the partial unique index allows one open job at
 * a time, so two workers cannot reserve or spend the same lamports
 */

function db() {
  if (!sql) throw new Error("The buyback ledger needs DATABASE_URL");
  return sql;
}

// any constant, shared by every process that reserves budget
const RESERVE_LOCK = 730_201;

export type JobState = "prepared" | "signed" | "submitted" | "finalized" | "failed";
export const OPEN_STATES: JobState[] = ["prepared", "signed", "submitted"];

export type Job = {
  id: string;
  state: JobState;
  treasury: string;
  mainMint: string;
  market: string | null;
  reservedLamports: number;
  maxQuoteLamports: number | null;
  tokenAmount: string | null;
  decimals: number | null;
  signature: string | null;
  signedTx: string | null;
  lastValidBlockHeight: number | null;
  expectedNetworkLamports: number | null;
  openedAccounts: string[];
  actualMarketLamports: number | null;
  actualNetworkLamports: number | null;
  burnedAmount: string | null;
  error: string | null;
  attempts: number;
  createdAt: string;
  finalizedAt: string | null;
};

type JobRow = Record<string, unknown>;

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

function toJob(r: JobRow): Job {
  return {
    id: r.id as string,
    state: r.state as JobState,
    treasury: r.treasury as string,
    mainMint: r.main_mint as string,
    market: (r.market as string) ?? null,
    reservedLamports: Number(r.reserved_lamports),
    maxQuoteLamports: num(r.max_quote_lamports),
    tokenAmount: (r.token_amount as string) ?? null,
    decimals: num(r.decimals),
    signature: (r.signature as string) ?? null,
    signedTx: (r.signed_tx as string) ?? null,
    lastValidBlockHeight: num(r.last_valid_block_height),
    expectedNetworkLamports: num(r.expected_network_lamports),
    openedAccounts: r.opened_accounts ? String(r.opened_accounts).split(",") : [],
    actualMarketLamports: num(r.actual_market_lamports),
    actualNetworkLamports: num(r.actual_network_lamports),
    burnedAmount: (r.burned_amount as string) ?? null,
    error: (r.error as string) ?? null,
    attempts: Number(r.attempts ?? 0),
    createdAt: new Date(r.created_at as string).toISOString(),
    finalizedAt: r.finalized_at ? new Date(r.finalized_at as string).toISOString() : null,
  };
}

/* ------------------------------------------------------------------ */
/* Credits                                                             */
/* ------------------------------------------------------------------ */

/** A claim sent the treasury its share; counted once its receipt is final */
export async function recordPendingCredit(c: {
  tokenId: string;
  mint: string;
  signature: string;
  treasury: string;
  mainMint: string | null;
  expectedLamports: number;
}) {
  await ensureSchema();
  await db()`
    insert into treasury_credits (id, token_id, mint, signature, treasury, main_mint, expected_lamports)
    values (${randomUUID()}, ${c.tokenId}, ${c.mint}, ${c.signature}, ${c.treasury}, ${c.mainMint}, ${c.expectedLamports})
    on conflict (signature) do nothing
  `;
}

export type PendingCredit = {
  id: string;
  signature: string;
  treasury: string;
  expectedLamports: number;
  createdAt: string;
};

export async function pendingCredits(limit = 20): Promise<PendingCredit[]> {
  await ensureSchema();
  const rows = await db()<JobRow[]>`
    select id, signature, treasury, expected_lamports, created_at
      from treasury_credits where state = 'pending'
     order by created_at limit ${limit}
  `;
  return rows.map((r) => ({
    id: r.id as string,
    signature: r.signature as string,
    treasury: r.treasury as string,
    expectedLamports: Number(r.expected_lamports),
    createdAt: new Date(r.created_at as string).toISOString(),
  }));
}

/** Writes what the finalized receipt said. Only a pending credit moves */
export async function settleCredit(id: string, v: CreditVerdict) {
  await ensureSchema();
  if (v.kind === "confirmed") {
    await db()`
      update treasury_credits
         set state = 'confirmed', confirmed_lamports = ${v.lamports}, confirmed_at = now(), note = null
       where id = ${id} and state = 'pending'
    `;
  } else {
    await db()`
      update treasury_credits set state = ${v.kind}, note = ${v.reason}
       where id = ${id} and state = 'pending'
    `;
  }
}

export async function noteCredit(id: string, note: string) {
  await db()`update treasury_credits set note = ${note} where id = ${id}`;
}

/* ------------------------------------------------------------------ */
/* Jobs                                                                */
/* ------------------------------------------------------------------ */

export async function openJob(): Promise<Job | null> {
  await ensureSchema();
  const [row] = await db()<JobRow[]>`
    select * from buyback_jobs where state in ('prepared', 'signed', 'submitted')
     order by created_at limit 1
  `;
  return row ? toJob(row) : null;
}

export async function getJob(id: string): Promise<Job | null> {
  const [row] = await db()<JobRow[]>`select * from buyback_jobs where id = ${id}`;
  return row ? toJob(row) : null;
}

/**
 * Reserves the next budget from confirmed credits, oldest first
 *
 * `budgetFor` turns what is available into the budget (0 for none), so the
 * minimum and maximum are applied to the figure read under the lock
 */
export async function reserveJob(input: {
  treasury: string;
  mainMint: string;
  budgetFor: (available: number) => number;
}): Promise<Job | null> {
  await ensureSchema();
  return db().begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(${RESERVE_LOCK})`;
    const [open] = await tx<JobRow[]>`
      select id from buyback_jobs where state in ('prepared', 'signed', 'submitted') limit 1
    `;
    if (open) return null;

    const credits = await tx<{ id: string; available: string }[]>`
      select id, (confirmed_lamports - allocated_lamports)::text as available
        from treasury_credits
       where state = 'confirmed' and treasury = ${input.treasury}
         and confirmed_lamports > allocated_lamports
       order by confirmed_at, created_at
       for update
    `;
    const balances = credits.map((c) => ({ id: c.id, available: Number(c.available) }));
    const available = balances.reduce((a, c) => a + c.available, 0);
    const budget = input.budgetFor(available);
    if (budget <= 0) return null;

    const allocations = allocate(balances, budget);
    const id = randomUUID();
    const [row] = await tx<JobRow[]>`
      insert into buyback_jobs (id, treasury, main_mint, reserved_lamports)
      values (${id}, ${input.treasury}, ${input.mainMint}, ${budget})
      returning *
    `;
    let seq = 0;
    for (const a of allocations) {
      await tx`
        insert into buyback_allocations (job_id, credit_id, lamports, seq)
        values (${id}, ${a.creditId}, ${a.lamports}, ${seq++})
      `;
      await tx`
        update treasury_credits set allocated_lamports = allocated_lamports + ${a.lamports}
         where id = ${a.creditId}
      `;
    }
    return toJob(row);
  });
}

/**
 * Takes the job for `seconds`, or returns null when another worker holds it
 *
 * Every write below checks the lease, so a worker that lost it cannot sign or
 * settle the job over the one that has it
 */
export async function leaseJob(id: string, owner: string, seconds = 90): Promise<Job | null> {
  const [row] = await db()<JobRow[]>`
    update buyback_jobs
       set lease_owner = ${owner}, lease_until = now() + make_interval(secs => ${seconds}), updated_at = now()
     where id = ${id}
       and state in ('prepared', 'signed', 'submitted')
       and (lease_until is null or lease_until < now() or lease_owner = ${owner})
    returning *
  `;
  return row ? toJob(row) : null;
}

export async function releaseLease(id: string, owner: string) {
  await db()`
    update buyback_jobs set lease_owner = null, lease_until = null
     where id = ${id} and lease_owner = ${owner}
  `;
}

/** Stores the signed transaction before anything is sent */
export async function markSigned(
  id: string,
  owner: string,
  s: {
    market: string;
    maxQuoteLamports: number;
    tokenAmount: string;
    decimals: number;
    signature: string;
    signedTx: string;
    lastValidBlockHeight: number;
    expectedNetworkLamports: number;
    openedAccounts: string[];
  },
) {
  const rows = await db()`
    update buyback_jobs
       set state = 'signed', market = ${s.market}, max_quote_lamports = ${s.maxQuoteLamports},
           token_amount = ${s.tokenAmount}, decimals = ${s.decimals}, signature = ${s.signature},
           signed_tx = ${s.signedTx}, last_valid_block_height = ${s.lastValidBlockHeight},
           expected_network_lamports = ${s.expectedNetworkLamports},
           opened_accounts = ${s.openedAccounts.join(",")}, updated_at = now()
     where id = ${id} and state = 'prepared' and lease_owner = ${owner} and lease_until > now()
    returning id
  `;
  if (rows.length !== 1) throw new Error("Lost the lease before the transaction was stored");
}

export async function markSubmitted(id: string, owner: string) {
  await db()`
    update buyback_jobs set state = 'submitted', attempts = attempts + 1, updated_at = now()
     where id = ${id} and state in ('signed', 'submitted') and lease_owner = ${owner}
  `;
}

export async function noteJob(id: string, error: string) {
  await db()`update buyback_jobs set error = ${error}, updated_at = now() where id = ${id}`;
}

/**
 * Closes a job and gives back what it did not spend
 *
 * A finalized job keeps what the market took, a failed one gives back all of
 * its budget. Both in one transaction with the job's own row
 */
export async function closeJob(
  id: string,
  owner: string,
  outcome:
    | {
        state: "finalized";
        marketLamports: number;
        networkLamports: number;
        burnedAmount: string;
        note?: string;
      }
    | { state: "failed"; error: string },
) {
  await db().begin(async (tx) => {
    const [job] = await tx<JobRow[]>`
      select * from buyback_jobs
       where id = ${id} and state in ('prepared', 'signed', 'submitted') and lease_owner = ${owner}
       for update
    `;
    if (!job) throw new Error("The job is not open or not leased by this worker");
    const reserved = Number(job.reserved_lamports);
    const spent = outcome.state === "finalized" ? Math.min(outcome.marketLamports, reserved) : 0;

    const allocs = await tx<{ credit_id: string; lamports: string }[]>`
      select credit_id, lamports::text from buyback_allocations where job_id = ${id} order by seq
    `;
    const back = releaseFrom(
      allocs.map((a): Allocation => ({ creditId: a.credit_id, lamports: Number(a.lamports) })),
      reserved - spent,
    );
    for (const b of back) {
      await tx`
        update treasury_credits set allocated_lamports = allocated_lamports - ${b.lamports}
         where id = ${b.creditId}
      `;
      await tx`
        update buyback_allocations set lamports = lamports - ${b.lamports}
         where job_id = ${id} and credit_id = ${b.creditId}
      `;
    }
    await tx`delete from buyback_allocations where job_id = ${id} and lamports = 0`;

    if (outcome.state === "finalized") {
      await tx`
        update buyback_jobs
           set state = 'finalized', actual_market_lamports = ${outcome.marketLamports},
               actual_network_lamports = ${outcome.networkLamports},
               burned_amount = ${outcome.burnedAmount}, error = ${outcome.note ?? null},
               signed_tx = null, finalized_at = now(), updated_at = now(),
               lease_owner = null, lease_until = null
         where id = ${id}
      `;
    } else {
      await tx`
        update buyback_jobs
           set state = 'failed', error = ${outcome.error}, signed_tx = null, updated_at = now(),
               lease_owner = null, lease_until = null
         where id = ${id}
      `;
    }
  });
}

/** Network fees and rent of the last 24 hours, counting open jobs at their estimate */
export async function networkSpentToday(): Promise<number> {
  await ensureSchema();
  const [r] = await db()<{ total: string | null }[]>`
    select (
      coalesce((select sum(actual_network_lamports) from buyback_jobs
                 where state = 'finalized' and finalized_at > now() - interval '24 hours'), 0)
      + coalesce((select sum(expected_network_lamports) from buyback_jobs
                 where state in ('signed', 'submitted')), 0)
    )::text as total
  `;
  return Number(r?.total ?? 0);
}

/* ------------------------------------------------------------------ */
/* For /admin                                                          */
/* ------------------------------------------------------------------ */

export type LedgerSummary = {
  availableLamports: number;
  reservedLamports: number;
  pendingCredits: number;
  manualCredits: number;
  spentLamports: number;
  networkLamports: number;
  burned: string;
  decimals: number;
  jobs: Job[];
};

export async function ledgerSummary(): Promise<LedgerSummary | null> {
  if (!sql) return null;
  await ensureSchema();
  const [c] = await db()<Record<string, string | null>[]>`
    select
      coalesce(sum(confirmed_lamports - allocated_lamports) filter (where state = 'confirmed'), 0)::text as available,
      count(*) filter (where state = 'pending')::text as pending,
      count(*) filter (where state = 'manual')::text as manual
    from treasury_credits
  `;
  const [j] = await db()<Record<string, string | null>[]>`
    select
      coalesce(sum(reserved_lamports) filter (where state in ('prepared', 'signed', 'submitted')), 0)::text as reserved,
      coalesce(sum(actual_market_lamports) filter (where state = 'finalized'), 0)::text as spent,
      coalesce(sum(actual_network_lamports) filter (where state = 'finalized'), 0)::text as network,
      coalesce(sum(burned_amount::numeric) filter (where state = 'finalized'), 0)::text as burned,
      max(decimals) as decimals
    from buyback_jobs
  `;
  const rows = await db()<JobRow[]>`select * from buyback_jobs order by created_at desc limit 10`;
  return {
    availableLamports: Number(c?.available ?? 0),
    reservedLamports: Number(j?.reserved ?? 0),
    pendingCredits: Number(c?.pending ?? 0),
    manualCredits: Number(c?.manual ?? 0),
    spentLamports: Number(j?.spent ?? 0),
    networkLamports: Number(j?.network ?? 0),
    burned: (j?.burned ?? "0").split(".")[0],
    decimals: Number(j?.decimals ?? 6),
    jobs: rows.map(toJob),
  };
}
