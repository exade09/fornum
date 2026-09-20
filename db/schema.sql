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
