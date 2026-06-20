-- Tokens personales para compartir enlaces (Atajos iOS / API)

create table public.share_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  constraint share_tokens_user_id_unique unique (user_id)
);

create index share_tokens_hash_idx on public.share_tokens (token_hash);

alter table public.share_tokens enable row level security;

create policy "share_tokens_select_own"
  on public.share_tokens for select
  to authenticated
  using (auth.uid() = user_id);

create policy "share_tokens_insert_own"
  on public.share_tokens for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "share_tokens_update_own"
  on public.share_tokens for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "share_tokens_delete_own"
  on public.share_tokens for delete
  to authenticated
  using (auth.uid() = user_id);
