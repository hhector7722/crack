-- ============================================================
-- drop_attachments: migración completa multi-archivo
--
-- 1. Crear drop_attachments
-- 2. Migrar datos legacy (file_url → attachment)
-- 3. Verificar integridad
-- 4. Eliminar columnas legacy
-- 5. Realtime
-- 6. RPC
-- ============================================================

-- ============================================================
-- Step 1: Crear tabla drop_attachments + RLS
-- ============================================================

create table if not exists public.drop_attachments (
  id uuid primary key default gen_random_uuid(),
  drop_id uuid not null references public.drops(id) on delete cascade,
  file_url text not null,
  content_type text not null check (content_type in ('text', 'image', 'audio', 'video', 'file')),
  created_at timestamptz not null default now()
);

create index if not exists idx_drop_attachments_drop_id on public.drop_attachments(drop_id);

alter table public.drop_attachments enable row level security;

create policy "attachments_select_own"
  on public.drop_attachments for select
  to authenticated
  using (exists (select 1 from public.drops where drops.id = drop_id and drops.user_id = auth.uid()));

create policy "attachments_insert_own"
  on public.drop_attachments for insert
  to authenticated
  with check (exists (select 1 from public.drops where drops.id = drop_id and drops.user_id = auth.uid()));

create policy "attachments_delete_own"
  on public.drop_attachments for delete
  to authenticated
  using (exists (select 1 from public.drops where drops.id = drop_id and drops.user_id = auth.uid()));

-- ============================================================
-- Step 2: Migrar datos legacy
-- Cada drop con file_url → un attachment
-- ============================================================

insert into public.drop_attachments (drop_id, file_url, content_type, created_at)
select
  d.id as drop_id,
  d.file_url,
  d.content_type,
  d.created_at
from public.drops d
where d.file_url is not null
  and not exists (
    select 1 from public.drop_attachments a where a.drop_id = d.id
  );

-- ============================================================
-- Step 3: Verificar integridad
-- ============================================================

do $$
declare
  v_drops_with_file integer;
  v_attachments_total integer;
  v_mismatch integer;
begin
  select count(*) into v_drops_with_file from public.drops where file_url is not null;
  select count(*) into v_attachments_total from public.drop_attachments;

  if v_drops_with_file != v_attachments_total then
    raise exception 'MISMATCH: % drops con file_url, pero % attachments creados',
      v_drops_with_file, v_attachments_total;
  end if;

  select count(*) into v_mismatch
  from public.drops d
  left join public.drop_attachments a on a.drop_id = d.id
  where d.file_url is not null
    and (a.file_url is distinct from d.file_url or a.content_type != d.content_type);

  if v_mismatch > 0 then
    raise exception '% attachments tienen file_url o content_type distinto al drop original', v_mismatch;
  end if;
end $$;

-- ============================================================
-- Step 4: Eliminar columnas legacy
-- ============================================================

alter table public.drops drop column if exists file_url;
alter table public.drops drop column if exists content_type;

-- ============================================================
-- Step 5: Realtime para drop_attachments
-- ============================================================

alter publication supabase_realtime add table public.drop_attachments;
alter table public.drop_attachments replica identity full;

-- ============================================================
-- Step 6: RPC — inserta drop + N attachments atómicamente
-- ============================================================

create or replace function public.insert_drop_with_attachments(
  p_user_id uuid,
  p_content text default null,
  p_attachments jsonb default '[]'::jsonb
) returns jsonb language plpgsql security definer as $$
declare
  v_drop_id uuid;
  v_attachment jsonb;
  v_result jsonb;
begin
  if auth.uid() != p_user_id and auth.role() != 'service_role' then
    raise exception 'permission denied';
  end if;

  insert into public.drops (content, user_id)
  values (p_content, p_user_id)
  returning id into v_drop_id;

  if p_attachments is not null and jsonb_array_length(p_attachments) > 0 then
    for v_attachment in select * from jsonb_array_elements(p_attachments)
    loop
      insert into public.drop_attachments (drop_id, file_url, content_type)
      values (v_drop_id, v_attachment->>'file_url', v_attachment->>'content_type');
    end loop;
  end if;

  select jsonb_build_object(
    'id', d.id,
    'content', d.content,
    'user_id', d.user_id,
    'created_at', d.created_at,
    'expires_at', d.expires_at,
    'attachments', coalesce(
      (select jsonb_agg(jsonb_build_object(
        'id', a.id,
        'drop_id', a.drop_id,
        'file_url', a.file_url,
        'content_type', a.content_type,
        'created_at', a.created_at
      ) order by a.created_at asc) from public.drop_attachments a where a.drop_id = d.id),
      '[]'::jsonb
    )
  ) into v_result
  from public.drops d
  where d.id = v_drop_id;

  return v_result;
end;
$$;
