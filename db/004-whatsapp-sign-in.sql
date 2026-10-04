-- Sign in by writing to the Fornum number, and a payout wallet per number
--
-- Run once against DATABASE_URL. Replaces the sign in codes that were sent
-- out through a provider: now the visitor sends the code to us, so nothing is
-- billed per sign in. Nothing here holds a phone number in the clear.

create table if not exists login_challenges (
  id            text primary key,
  -- what the visitor sends to the number, short and unambiguous
  code          text unique not null,
  -- the number typed on the site, the message has to come from it
  phone_hash    text not null,
  phone_masked  text not null,
  -- hash of the secret held in the browser cookie, so only the browser that
  -- asked can turn an approved challenge into a session
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
