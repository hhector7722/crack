-- Drop: bandeja temporal aislada de items

create table public.drops (
  id uuid primary key default gen_random_uuid(),
  content text,
  file_url text,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '48 hours',
  constraint drops_content_or_file_url_check check (
    nullif(btrim(coalesce(content, '')), '') is not null
    or file_url is not null
  )
);

create index drops_user_created_idx on public.drops (user_id, created_at desc);
create index drops_expires_at_idx on public.drops (expires_at);

alter table public.drops enable row level security;

create policy "drops_select_own"
  on public.drops for select
  to authenticated
  using (auth.uid() = user_id);

create policy "drops_insert_own"
  on public.drops for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "drops_update_own"
  on public.drops for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "drops_delete_own"
  on public.drops for delete
  to authenticated
  using (auth.uid() = user_id);

create extension if not exists pg_cron with schema extensions;

do $drop_cron$
begin
  if exists (select 1 from cron.job where jobname = 'delete_expired_drops') then
    perform cron.unschedule('delete_expired_drops');
  end if;

  perform cron.schedule(
    'delete_expired_drops',
    '*/15 * * * *',
    $$delete from public.drops where expires_at < now();$$
  );
end $drop_cron$;
