alter table public.items
  add column if not exists last_opened_at timestamptz null;

create index if not exists items_user_last_opened_idx
  on public.items (user_id, last_opened_at desc)
  where last_opened_at is not null;
