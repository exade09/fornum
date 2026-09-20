import { sql } from "@/lib/db/client";
import { siteConfig } from "@/lib/config";
import { DEMO_CLAIMS, DEMO_TOKENS } from "@/lib/demo-data";
import type { Claim, LaunchRequest, Token } from "@/lib/types";

/**
 * Every read and write the app does, in one place
 *
 * With a database configured these are SQL. Without one they run against arrays
 * in memory, seeded from the demo rows when demoData is on and empty otherwise,
 * so the site works end to end before anything is provisioned. Memory does not
 * survive a restart, which is the point: it is not a database
 */

/**
 * Reads must not take the site down
 *
 * A missing table or an unreachable database is an operator problem, not a
 * reason for every visitor to see a crash. Reads fall back to empty and record
 * why, which /admin shows. Writes still throw: a claim that failed must never
 * look like it worked
 */
let lastReadError: string | null = null;

export function dbError() {
  return lastReadError;
}

async function safeRead<T>(what: string, run: () => Promise<T>, fallback: T) {
  try {
    const value = await run();
    lastReadError = null;
    return value;
  } catch (err) {
    lastReadError = `${what}: ${err instanceof Error ? err.message : String(err)}`;
    console.error("[db]", lastReadError);
    return fallback;
  }
}

const mem = {
  tokens: [] as Token[],
  claims: [] as Claim[],
  requests: [] as LaunchRequest[],
  seeded: false,
};

function seed() {
  if (mem.seeded) return;
  mem.seeded = true;
  if (siteConfig.demoData) {
    mem.tokens = [...DEMO_TOKENS];
    mem.claims = [...DEMO_CLAIMS];
  }
}

/* ------------------------------------------------------------------ */
/* Row mapping                                                         */
/* ------------------------------------------------------------------ */

type TokenRow = {
  id: string;
  mint: string;
  name: string;
  symbol: string;
  status: string;
  owner_hash: string;
  owner_masked: string;
  assignee_hash: string | null;
  assignee_masked: string | null;
  launch_wallet: string;
  // absent until the migration has run
  wallet_index?: number | null;
  baseline_lamports?: string | null;
  fees_accrued_lamports: string;
  fees_claimed_lamports: string;
  market_cap_usd: string;
  holders: number;
  created_at: Date;
};

function toToken(r: TokenRow): Token {
  return {
    id: r.id,
    mint: r.mint,
    name: r.name,
    symbol: r.symbol,
    status: r.status as Token["status"],
    ownerHash: r.owner_hash,
    ownerMasked: r.owner_masked,
    assigneeHash: r.assignee_hash,
    assigneeMasked: r.assignee_masked,
    launchWallet: r.launch_wallet,
    // both tolerate a database that has not had the migration run yet, so the
    // order of deploy and migration cannot put NaN on a page
    walletIndex: r.wallet_index ?? null,
    baselineLamports: Number(r.baseline_lamports ?? 0),
    feesAccruedLamports: Number(r.fees_accrued_lamports),
    feesClaimedLamports: Number(r.fees_claimed_lamports),
    marketCapUsd: Number(r.market_cap_usd),
    holders: r.holders,
    createdAt: r.created_at.toISOString(),
  };
}

type ClaimRow = {
  id: string;
  token_id: string;
  amount_lamports: string;
  wallet: string;
  tx: string;
  created_at: Date;
};

function toClaim(r: ClaimRow): Claim {
  return {
    id: r.id,
    tokenId: r.token_id,
    amountLamports: Number(r.amount_lamports),
    wallet: r.wallet,
    tx: r.tx,
    createdAt: r.created_at.toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/* Tokens                                                              */
/* ------------------------------------------------------------------ */

export async function listTokens(): Promise<Token[]> {
  if (!sql) {
    seed();
    return mem.tokens;
  }
  return safeRead(
    "listTokens",
    async () => {
      const rows = await sql!<TokenRow[]>`
        select * from tokens order by created_at desc
      `;
      return rows.map(toToken);
    },
    [],
  );
}

export async function getToken(id: string): Promise<Token | null> {
  if (!sql) {
    seed();
    return mem.tokens.find((t) => t.id === id) ?? null;
  }
  return safeRead(
    "getToken",
    async () => {
      const rows = await sql!<TokenRow[]>`
        select * from tokens where id = ${id} limit 1
      `;
      return rows[0] ? toToken(rows[0]) : null;
    },
    null,
  );
}

export async function createToken(
  t: Omit<Token, "createdAt"> & { createdAt?: string },
): Promise<Token> {
  const created = t.createdAt ?? new Date().toISOString();

  if (!sql) {
    seed();
    const token: Token = { ...t, createdAt: created };
    mem.tokens.unshift(token);
    return token;
  }

  const rows = await sql<TokenRow[]>`
    insert into tokens (
      id, mint, name, symbol, status,
      owner_hash, owner_masked, assignee_hash, assignee_masked,
      launch_wallet, wallet_index, baseline_lamports,
      fees_accrued_lamports, fees_claimed_lamports,
      market_cap_usd, holders
    ) values (
      ${t.id}, ${t.mint}, ${t.name}, ${t.symbol}, ${t.status},
      ${t.ownerHash}, ${t.ownerMasked}, ${t.assigneeHash ?? null}, ${t.assigneeMasked ?? null},
      ${t.launchWallet}, ${t.walletIndex ?? null}, ${t.baselineLamports},
      ${t.feesAccruedLamports}, ${t.feesClaimedLamports},
      ${t.marketCapUsd}, ${t.holders}
    )
    returning *
  `;
  return toToken(rows[0]);
}

/** Point the fees of a token at a different number. One way on purpose */
export async function assignToken(
  id: string,
  assigneeHash: string,
  assigneeMasked: string,
): Promise<Token | null> {
  if (!sql) {
    seed();
    const t = mem.tokens.find((x) => x.id === id);
    if (!t) return null;
    t.assigneeHash = assigneeHash;
    t.assigneeMasked = assigneeMasked;
    return t;
  }

  const rows = await sql<TokenRow[]>`
    update tokens
       set assignee_hash = ${assigneeHash},
           assignee_masked = ${assigneeMasked}
     where id = ${id}
    returning *
  `;
  return rows[0] ? toToken(rows[0]) : null;
}

/** Refresh what the launch wallet has taken in, from an on chain read */
export async function setAccrued(id: string, lamports: number) {
  if (!sql) {
    seed();
    const t = mem.tokens.find((x) => x.id === id);
    if (t) t.feesAccruedLamports = lamports;
    return;
  }
  await sql`
    update tokens set fees_accrued_lamports = ${lamports} where id = ${id}
  `;
}

/**
 * Remove a token and everything recorded against it
 *
 * Launches get recorded wrong: a typo in the mint, the wrong number, a test
 * row that should never have been on the public list. Claims carry an on
 * delete cascade, so they go with it, which is the honest behaviour: a claim
 * against a token that no longer exists is not a record of anything
 */
export async function deleteToken(id: string): Promise<boolean> {
  if (!sql) {
    seed();
    const before = mem.tokens.length;
    mem.tokens = mem.tokens.filter((t) => t.id !== id);
    mem.claims = mem.claims.filter((c) => c.tokenId !== id);
    return mem.tokens.length < before;
  }

  const rows = await sql`delete from tokens where id = ${id} returning id`;
  return rows.length > 0;
}

/* ------------------------------------------------------------------ */
/* Claims                                                              */
/* ------------------------------------------------------------------ */

export async function listClaims(limit = 50): Promise<Claim[]> {
  if (!sql) {
    seed();
    return mem.claims.slice(0, limit);
  }
  return safeRead(
    "listClaims",
    async () => {
      const rows = await sql!<ClaimRow[]>`
        select * from claims order by created_at desc limit ${limit}
      `;
      return rows.map(toClaim);
    },
    [],
  );
}

export async function claimsForToken(tokenId: string): Promise<Claim[]> {
  if (!sql) {
    seed();
    return mem.claims.filter((c) => c.tokenId === tokenId);
  }
  return safeRead(
    "claimsForToken",
    async () => {
      const rows = await sql!<ClaimRow[]>`
        select * from claims where token_id = ${tokenId} order by created_at desc
      `;
      return rows.map(toClaim);
    },
    [],
  );
}

/**
 * Write the claim and move the token's claimed total in one go, so a crash
 * between the two cannot let the same fees be taken twice
 */
export async function recordClaim(c: Omit<Claim, "createdAt">): Promise<Claim> {
  const created = new Date().toISOString();

  if (!sql) {
    seed();
    const claim: Claim = { ...c, createdAt: created };
    mem.claims.unshift(claim);
    const t = mem.tokens.find((x) => x.id === c.tokenId);
    if (t) t.feesClaimedLamports += c.amountLamports;
    return claim;
  }

  const [row] = await sql.begin(async (tx) => {
    const inserted = await tx<ClaimRow[]>`
      insert into claims (id, token_id, amount_lamports, wallet, tx)
      values (${c.id}, ${c.tokenId}, ${c.amountLamports}, ${c.wallet}, ${c.tx})
      returning *
    `;
    await tx`
      update tokens
         set fees_claimed_lamports = fees_claimed_lamports + ${c.amountLamports}
       where id = ${c.tokenId}
    `;
    return inserted;
  });

  return toClaim(row as unknown as ClaimRow);
}

/* ------------------------------------------------------------------ */
/* Launch requests, the operator queue                                 */
/* ------------------------------------------------------------------ */

export async function listRequests(): Promise<LaunchRequest[]> {
  if (!sql) {
    seed();
    return mem.requests;
  }
  return safeRead(
    "listRequests",
    async () => {
      const rows = await sql!<
        {
          id: string;
          phone_hash: string;
          phone_masked: string;
          note: string | null;
          status: string;
          token_id: string | null;
          created_at: Date;
        }[]
      >`select * from launch_requests order by created_at desc limit 100`;

      return rows.map((r) => ({
        id: r.id,
        phoneHash: r.phone_hash,
        phoneMasked: r.phone_masked,
        note: r.note,
        status: r.status as LaunchRequest["status"],
        tokenId: r.token_id,
        createdAt: r.created_at.toISOString(),
      }));
    },
    [],
  );
}

export async function createRequest(
  r: Omit<LaunchRequest, "createdAt" | "status" | "tokenId"> & {
    status?: LaunchRequest["status"];
  },
): Promise<LaunchRequest> {
  const row: LaunchRequest = {
    ...r,
    status: r.status ?? "new",
    tokenId: null,
    createdAt: new Date().toISOString(),
  };

  if (!sql) {
    seed();
    mem.requests.unshift(row);
    return row;
  }

  await sql`
    insert into launch_requests (id, phone_hash, phone_masked, note, status)
    values (${row.id}, ${row.phoneHash}, ${row.phoneMasked}, ${row.note}, ${row.status})
  `;
  return row;
}

export async function markRequestLaunched(id: string, tokenId: string) {
  if (!sql) {
    seed();
    const r = mem.requests.find((x) => x.id === id);
    if (r) {
      r.status = "launched";
      r.tokenId = tokenId;
    }
    return;
  }
  await sql`
    update launch_requests
       set status = 'launched', token_id = ${tokenId}
     where id = ${id}
  `;
}
