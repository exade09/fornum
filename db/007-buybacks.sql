-- Buybacks of the Fornum token
--
-- Fornum's 20% of other people's coins buys the Fornum token on pump.fun and
-- the bought tokens are burned. Until a buy runs the share waits on the coin's
-- launch wallet, counted in buyback_pending_lamports. Every buy is one row in
-- buybacks with both transactions.
--
-- The app adds all of this by itself on start, so running it by hand is
-- optional. Safe to run more than once.

alter table tokens add column if not exists buyback_pending_lamports bigint not null default 0;

create table if not exists buybacks (
  id              text primary key,
  token_id        text not null references tokens (id) on delete cascade,
  -- SOL that left the launch wallet for the buy and the burn, fees included
  spent_lamports  bigint not null,
  -- raw token amount, as text because it can outgrow bigint
  tokens_bought   text not null,
  tokens_burned   text not null default '0',
  decimals        integer not null default 6,
  buy_tx          text not null,
  burn_tx         text,
  created_at      timestamptz not null default now()
);

create index if not exists buybacks_created_at_idx on buybacks (created_at desc);
create index if not exists buybacks_unburned_idx on buybacks (token_id) where burn_tx is null;
