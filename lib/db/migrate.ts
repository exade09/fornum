import { sql } from "@/lib/db/client";

/**
 * Brings the database up to what the code expects, once per server start
 *
 * Everything here only adds: `create table if not exists`, and a column only
 * when it is missing (checked first, so a running site never waits on a lock
 * for a column that is already there). Nothing is dropped or rewritten, so
 * running it against a database that is already current changes nothing.
 * It mirrors db/schema.sql and the numbered files next to it, which stay the
 * reference for running by hand
 */

const TABLES = [
  `create table if not exists tokens (
    id text primary key,
    mint text unique not null,
    name text not null,
    symbol text not null,
    status text not null default 'live',
    image_url text,
    owner_hash text not null,
    owner_masked text not null,
    assignee_hash text,
    assignee_masked text,
    launch_wallet text not null,
    wallet_index integer,
    baseline_lamports bigint not null default 0,
    fees_accrued_lamports bigint not null default 0,
    fees_claimed_lamports bigint not null default 0,
    market_cap_usd numeric not null default 0,
    holders integer not null default 0,
    created_at timestamptz not null default now()
  )`,
  `create index if not exists tokens_owner_hash_idx on tokens (owner_hash)`,
  `create index if not exists tokens_assignee_hash_idx on tokens (assignee_hash)`,
  `create index if not exists tokens_created_at_idx on tokens (created_at desc)`,
  `create table if not exists claims (
    id text primary key,
    token_id text not null references tokens (id) on delete cascade,
    amount_lamports bigint not null,
    wallet text not null,
    tx text not null,
    created_at timestamptz not null default now()
  )`,
  `create index if not exists claims_token_id_idx on claims (token_id)`,
  `create index if not exists claims_created_at_idx on claims (created_at desc)`,
  `create table if not exists launch_requests (
    id text primary key,
    phone_hash text not null,
    phone_masked text not null,
    note text,
    status text not null default 'new',
    token_id text references tokens (id) on delete set null,
    created_at timestamptz not null default now()
  )`,
  `create table if not exists verify_attempts (
    phone_hash text not null,
    ip text not null,
    created_at timestamptz not null default now()
  )`,
  `create index if not exists verify_attempts_recent on verify_attempts (created_at desc)`,
  `create index if not exists verify_attempts_phone on verify_attempts (phone_hash, created_at desc)`,
  `create table if not exists login_challenges (
    id text primary key,
    code text unique not null,
    phone_hash text not null,
    phone_masked text not null,
    browser_hash text not null,
    status text not null default 'pending',
    expires_at timestamptz not null,
    created_at timestamptz not null default now()
  )`,
  `create index if not exists login_challenges_expires on login_challenges (expires_at)`,
  `create table if not exists accounts (
    phone_hash text primary key,
    wallet text not null,
    updated_at timestamptz not null default now()
  )`,
  `create table if not exists sign_in_links (
    token_hash text primary key,
    phone_hash text not null,
    phone_masked text not null,
    expires_at timestamptz not null,
    created_at timestamptz not null default now()
  )`,
  `create index if not exists sign_in_links_expires on sign_in_links (expires_at)`,
  `create table if not exists buybacks (
    id text primary key,
    token_id text not null references tokens (id) on delete cascade,
    spent_lamports bigint not null,
    tokens_bought text not null,
    tokens_burned text not null default '0',
    decimals integer not null default 6,
    buy_tx text not null,
    burn_tx text,
    created_at timestamptz not null default now()
  )`,
  `create index if not exists buybacks_created_at_idx on buybacks (created_at desc)`,
  `create index if not exists buybacks_unburned_idx on buybacks (token_id) where burn_tx is null`,
];

/** Columns added to tokens after it was first created, by later migrations */
const TOKEN_COLUMNS: Record<string, string> = {
  wallet_index: "integer",
  baseline_lamports: "bigint not null default 0",
  image_url: "text",
  fees_fornum_lamports: "bigint not null default 0",
  buyback_pending_lamports: "bigint not null default 0",
};

let done: Promise<void> | null = null;

export function ensureSchema() {
  if (!sql) return Promise.resolve();
  done ??= (async () => {
    for (const statement of TABLES) await sql!.unsafe(statement);
    const have = await sql!<{ column_name: string }[]>`
      select column_name from information_schema.columns
      where table_schema = current_schema() and table_name = 'tokens'
    `;
    const present = new Set(have.map((r) => r.column_name));
    // masks once showed the last four digits, now only two
    for (const [table, column] of [
      ["tokens", "owner_masked"],
      ["tokens", "assignee_masked"],
      ["launch_requests", "phone_masked"],
      ["login_challenges", "phone_masked"],
      ["sign_in_links", "phone_masked"],
    ]) {
      await sql!.unsafe(
        `update ${table} set ${column} = regexp_replace(${column}, ' ••• [0-9]*([0-9]{2})$', ' ••• \\1') where ${column} ~ ' ••• [0-9]{3,}$'`,
      );
    }
    for (const [column, type] of Object.entries(TOKEN_COLUMNS)) {
      if (!present.has(column)) {
        await sql!.unsafe(`alter table tokens add column if not exists ${column} ${type}`);
        console.info(`[db] added tokens.${column}`);
      }
    }
  })().catch((err) => {
    // try again on the next call rather than remembering a failure forever
    done = null;
    throw err;
  });
  return done;
}
