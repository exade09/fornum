-- One wallet per launch
--
-- Run once against DATABASE_URL. Existing rows keep wallet_index null and a
-- zero baseline, which leaves them on the shared wallet and on the fee totals
-- recorded by hand, so nothing already launched changes behaviour.

alter table tokens add column if not exists wallet_index integer;
alter table tokens add column if not exists baseline_lamports bigint not null default 0;
