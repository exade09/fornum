-- Fornum storage. Run once against the database in DATABASE_URL.
--
-- Amounts are lamports, stored as bigint. Nothing here holds a phone number in
-- the clear: the hash is what identifies a person, the masked copy is only for
-- display and is derived from the number at sign in.

create table if not exists tokens (
  id                    text primary key,
  mint                  text unique not null,
  name                  text not null,
  symbol                text not null,
  status                text not null default 'live',
  -- the picture pump.fun shows for the coin, on IPFS
  image_url             text,

  -- the number that asked for the launch
  owner_hash            text not null,
  owner_masked          text not null,

  -- set when the owner hands the fees to somebody else
  assignee_hash         text,
  assignee_masked       text,

  -- the wallet that deployed the mint and therefore collects the creator fees
  launch_wallet         text not null,
  -- which wallet of the launch phrase it is, null for the old shared wallet
  wallet_index          integer,
  -- what that wallet held once the launch was paid for, everything above is fees
  baseline_lamports     bigint not null default 0,

  fees_accrued_lamports bigint not null default 0,
  fees_claimed_lamports bigint not null default 0,
  -- Fornum's 20% split off at claims, for coins without a native split
  fees_fornum_lamports  bigint not null default 0,
  -- null: split by the site at claims; 'pending' / 'native': locked on chain at launch
  fee_sharing           text,
  -- newest distribution signature already read for the treasury ledger
  fee_scan_cursor       text,

  market_cap_usd        numeric not null default 0,
  holders               integer not null default 0,

  created_at            timestamptz not null default now()
);

create index if not exists tokens_owner_hash_idx on tokens (owner_hash);
create index if not exists tokens_assignee_hash_idx on tokens (assignee_hash);
create index if not exists tokens_created_at_idx on tokens (created_at desc);

create table if not exists claims (
  id              text primary key,
  token_id        text not null references tokens (id) on delete cascade,
  amount_lamports bigint not null,
  -- destination address the money went to
  wallet          text not null,
  tx              text not null,
  created_at      timestamptz not null default now()
);

create index if not exists claims_token_id_idx on claims (token_id);
create index if not exists claims_created_at_idx on claims (created_at desc);

-- What the operator works through. A request arrives over WhatsApp, the
-- operator deploys the mint by hand and links the two here.
create table if not exists launch_requests (
  id            text primary key,
  phone_hash    text not null,
  phone_masked  text not null,
  note          text,
  status        text not null default 'new',
  token_id      text references tokens (id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists launch_requests_status_idx on launch_requests (status, created_at desc);

-- Sign in codes asked for, so the cost of sending them can be capped.
-- Only a salted hash, never a number in the clear
create table if not exists verify_attempts (
  phone_hash text not null,
  ip         text not null,
  created_at timestamptz not null default now()
);

create index if not exists verify_attempts_recent
  on verify_attempts (created_at desc);
create index if not exists verify_attempts_phone
  on verify_attempts (phone_hash, created_at desc);

-- Sign in by writing to the Fornum number. The visitor types a number, gets a
-- code, and sends it from that number; the operator confirms it in /admin with
-- the number it came from, and only the browser holding the matching secret
-- can turn it into a session
create table if not exists login_challenges (
  id            text primary key,
  code          text unique not null,
  phone_hash    text not null,
  phone_masked  text not null,
  browser_hash  text not null,
  status        text not null default 'pending',
  expires_at    timestamptz not null,
  created_at    timestamptz not null default now()
);

create index if not exists login_challenges_expires on login_challenges (expires_at);

-- Where a number wants its fees sent
create table if not exists accounts (
  phone_hash  text primary key,
  wallet      text not null,
  updated_at  timestamptz not null default now()
);

-- One time sign in links the operator pastes into the WhatsApp thread, with
-- the mint after a launch or on request. Only the token's hash is kept
create table if not exists sign_in_links (
  token_hash    text primary key,
  phone_hash    text not null,
  phone_masked  text not null,
  expires_at    timestamptz not null,
  created_at    timestamptz not null default now()
);

create index if not exists sign_in_links_expires on sign_in_links (expires_at);

-- Buyback of the Fornum token from the treasury's 20%, see 007-buybacks.sql
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
  -- claim: the site's own split; distribution: pump.fun's native payout
  kind                text not null default 'claim',
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

-- Fee split locked on chain at launch, see 008-fee-shares.sql
create table if not exists launch_fee_policies (
  mint            text primary key,
  developer       text not null,
  treasury        text not null,
  developer_bps   integer not null,
  treasury_bps    integer not null,
  -- expected, submitted, verified, failed
  state           text not null default 'expected',
  signature       text unique,
  error           text,
  created_at      timestamptz not null default now(),
  verified_at     timestamptz,
  check (developer_bps + treasury_bps = 10000),
  check (developer <> treasury)
);

create table if not exists app_settings (
  key         text primary key,
  value       text not null,
  updated_at  timestamptz not null default now()
);

-- one claim at a time per coin, across every server instance
create table if not exists claim_locks (
  token_id    text primary key,
  owner       text not null,
  expires_at  timestamptz not null
);
