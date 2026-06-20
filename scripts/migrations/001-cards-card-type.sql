-- Run in Supabase SQL editor if you see "column cards.card_type does not exist"
alter table cards add column if not exists card_type text not null default 'feature'
  check (card_type in ('blueprint','feature'));
