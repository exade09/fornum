-- Token pictures
--
-- The app adds this column by itself on the first write that needs it, so
-- running this by hand is optional. Safe to run more than once.

alter table tokens add column if not exists image_url text;
