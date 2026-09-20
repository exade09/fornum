-- Rate limiting for sign in codes
--
-- Run once against DATABASE_URL. Every verification is billed, so the count
-- has to survive a cold start, which an in memory counter does not.
-- Nothing here holds a phone number in the clear, only its salted hash.

create table if not exists verify_attempts (
  phone_hash text not null,
  ip         text not null,
  created_at timestamptz not null default now()
);

create index if not exists verify_attempts_recent
  on verify_attempts (created_at desc);
create index if not exists verify_attempts_phone
  on verify_attempts (phone_hash, created_at desc);
