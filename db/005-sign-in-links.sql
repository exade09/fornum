-- One time sign in links the operator pastes into the WhatsApp thread
--
-- Run once against DATABASE_URL. Only the hash of a link's token is kept, a
-- link works once and expires after a week.

create table if not exists sign_in_links (
  token_hash    text primary key,
  phone_hash    text not null,
  phone_masked  text not null,
  expires_at    timestamptz not null,
  created_at    timestamptz not null default now()
);

create index if not exists sign_in_links_expires on sign_in_links (expires_at);
