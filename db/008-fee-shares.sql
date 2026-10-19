-- Fee split locked on chain at launch
--
-- Every new coin is created with pump.fun's fee sharing: 80% to its launch
-- wallet, 20% to the treasury, fixed in the same transaction as the coin.
-- launch_fee_policies holds the split each launch was meant to have, written
-- before the transaction is signed, and what checking the chain found.
-- tokens.fee_sharing says how a coin's fees are paid: null for coins created
-- before this (collected and split by the site), 'native' once the split is
-- verified on chain, 'pending' until then. Fees of a coin that is not
-- verified are not paid out.
-- app_settings keeps the address of the launch lookup table.
--
-- The app creates all of this by itself on start. Safe to run more than once.

alter table tokens add column if not exists fee_sharing text;
alter table tokens add column if not exists fee_scan_cursor text;

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

alter table treasury_credits add column if not exists kind text not null default 'claim';

-- one claim at a time per coin, across every server instance
create table if not exists claim_locks (
  token_id    text primary key,
  owner       text not null,
  expires_at  timestamptz not null
);
