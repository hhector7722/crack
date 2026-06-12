-- Crack: items table + RLS + storage bucket

create table public.items (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('note', 'image', 'audio')),
  title text,
  content text,
  file_url text,
  metadata jsonb not null default '{}'::jsonb,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade
);

create index items_user_created_idx on public.items (user_id, pinned desc, created_at desc);

alter table public.items enable row level security;

create policy "items_select_own"
  on public.items for select
  to authenticated
  using (auth.uid() = user_id);

create policy "items_insert_own"
  on public.items for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "items_update_own"
  on public.items for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "items_delete_own"
  on public.items for delete
  to authenticated
  using (auth.uid() = user_id);

-- Storage bucket (private)
insert into storage.buckets (id, name, public)
values ('crack-files', 'crack-files', false)
on conflict (id) do nothing;

create policy "crack_files_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'crack-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "crack_files_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'crack-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "crack_files_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'crack-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'crack-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "crack_files_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'crack-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
