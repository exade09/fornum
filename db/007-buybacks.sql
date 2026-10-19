-- Buyback of the Fornum token from the treasury's 20%
--
-- treasury_credits is the ledger: one row per claim whose 20% reached the
-- treasury, with the amount measured from the finalized receipt. Only these
-- rows fund buybacks, never the treasury's balance.
-- buyback_jobs is one buy-and-burn transaction each, durable across restarts:
-- the signed bytes are kept sealed before the first send, and the job only
-- moves on what a finalized receipt says.
-- buyback_allocations records which credits a job reserved, so what a buy did
-- not spend goes back to the credits it came from.
--
-- The app creates all of this by itself on start. Safe to run more than once.

create table if not exists treasury_credits (
  id                  text primary key,
  token_id            text references tokens (id) on delete set null,
  mint                text not null,
  -- the claim transaction that paid the treasury
  signature           text not null unique,
  treasury            text not null,
  main_mint           text,
  expected_lamports   bigint not null,
  -- set from the finalized receipt, nothing is spent before it is
  confirmed_lamports  bigint,
  allocated_lamports  bigint not null default 0,
  -- pending, confirmed, failed, manual
  state               text not null default 'pending',
  note                text,
  created_at          timestamptz not null default now(),
  confirmed_at        timestamptz,
  check (allocated_lamports >= 0),
  check (confirmed_lamports is null or allocated_lamports <= confirmed_lamports)
);

create index if not exists treasury_credits_open on treasury_credits (state, created_at);

create table if not exists buyback_jobs (
  id                        text primary key,
  -- prepared, signed, submitted, finalized, failed
  state                     text not null default 'prepared',
  treasury                  text not null,
  main_mint                 text not null,
  market                    text,
  reserved_lamports         bigint not null,
  max_quote_lamports        bigint,
  -- base units bought and burned in the same transaction
  token_amount              text,
  decimals                  integer,
  signature                 text unique,
  -- the signed transaction, sealed (AES-256-GCM)
  signed_tx                 text,
  last_valid_block_height   bigint,
  expected_network_lamports bigint,
  -- accounts the simulation saw the transaction open, their rent is network cost
  opened_accounts           text,
  actual_market_lamports    bigint,
  actual_network_lamports   bigint,
  burned_amount             text,
  error                     text,
  lease_owner               text,
  lease_until               timestamptz,
  attempts                  integer not null default 0,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  finalized_at              timestamptz,
  check (reserved_lamports > 0)
);

-- one open buyback at a time, so two workers cannot spend the same budget
create unique index if not exists buyback_jobs_one_open
  on buyback_jobs ((true)) where state in ('prepared', 'signed', 'submitted');
create index if not exists buyback_jobs_created on buyback_jobs (created_at desc);

create table if not exists buyback_allocations (
  job_id     text not null references buyback_jobs (id) on delete cascade,
  credit_id  text not null references treasury_credits (id) on delete cascade,
  lamports   bigint not null check (lamports > 0),
  seq        integer not null,
  primary key (job_id, credit_id)
);
