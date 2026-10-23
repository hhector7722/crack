-- Extra: per-session PIN access, RLS and membership changes.
create table if not exists public.extra_unlocks (
  session_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null
);
create index if not exists extra_unlocks_user_idx on public.extra_unlocks(user_id);
alter table public.extra_unlocks enable row level security;
revoke all on public.extra_unlocks from anon, authenticated;

create or replace function public.can_view_extra()
returns boolean language sql stable security definer set search_path = ''
as $$
  select coalesce(
    (select auth.uid()) is not null
    and exists (
      select 1 from public.extra_unlocks e
      where e.user_id = (select auth.uid())
        and e.session_id = (select auth.jwt()->>'session_id')
        and e.expires_at > now()
    ), false
  )
$$;
revoke all on function public.can_view_extra() from public;
grant execute on function public.can_view_extra() to authenticated;

create or replace function public.unlock_extra(p_pin text)
returns boolean language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_session text := (select auth.jwt()->>'session_id');
begin
  if v_user is null or nullif(v_session,'') is null then
    raise exception 'Autenticación requerida';
  end if;
  if p_pin is distinct from '1313' then return false; end if;
  insert into public.extra_unlocks(session_id,user_id,expires_at)
  values (v_session,v_user,now()+interval '20 minutes')
  on conflict (session_id) do update
    set user_id=excluded.user_id, expires_at=excluded.expires_at;
  return true;
end;
$$;
revoke all on function public.unlock_extra(text) from public;
grant execute on function public.unlock_extra(text) to authenticated;

create or replace function public.lock_extra()
returns void language plpgsql volatile security definer set search_path = ''
as $$
begin
  delete from public.extra_unlocks
  where session_id=(select auth.jwt()->>'session_id') and user_id=(select auth.uid());
end;
$$;
revoke all on function public.lock_extra() from public;
grant execute on function public.lock_extra() to authenticated;

create or replace function public.set_item_extra(p_item_id uuid, p_extra boolean)
returns void language plpgsql volatile security definer set search_path = ''
as $$
declare v_user uuid := (select auth.uid());
begin
  if v_user is null then raise exception 'Autenticación requerida'; end if;
  update public.items i
  set metadata=jsonb_set(coalesce(i.metadata,'{}'::jsonb),'{extra}',to_jsonb(p_extra),true)
  where i.id=p_item_id and i.user_id=v_user
    and (
      i.type in ('image','video')
      or (i.type='note' and (
        btrim(coalesce(i.content,'')) ~ '^https?://[^[:space:]]+$'
        or btrim(coalesce(i.title,'')) ~ '^https?://[^[:space:]]+$'
      ))
    );
  if not found then raise exception 'Elemento no permitido o inexistente'; end if;
end;
$$;
revoke all on function public.set_item_extra(uuid,boolean) from public;
grant execute on function public.set_item_extra(uuid,boolean) to authenticated;

drop policy if exists items_select_own on public.items;
create policy items_select_own on public.items for select to authenticated
using ((select auth.uid())=user_id and (
  (metadata->>'extra') is distinct from 'true' or (select public.can_view_extra())
));

-- Prevent direct calls to the search function from bypassing RLS.
alter function public.search_items_v1(uuid,text,vector,integer,integer) security invoker;

-- Reorder only regular pinned items (Extra is not displayed in Fijados).
create or replace function public.set_pinned_order(p_item_ids uuid[])
returns void language plpgsql security invoker set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_count integer;
begin
  if v_user_id is null then raise exception 'Usuario no autenticado'; end if;
  perform 1 from public.items
    where user_id=v_user_id and pinned
      and (metadata->>'extra') is distinct from 'true'
    order by id for update;
  select count(*) into v_count from public.items
    where user_id=v_user_id and pinned
      and (metadata->>'extra') is distinct from 'true';
  if p_item_ids is null
    or cardinality(p_item_ids)<>v_count
    or (select count(distinct pinned_id) from unnest(p_item_ids) as pinned_id)<>v_count
    or exists (
      select 1 from unnest(p_item_ids) as x(pinned_id)
      left join public.items i on i.id=x.pinned_id and i.user_id=v_user_id
        and i.pinned and (i.metadata->>'extra') is distinct from 'true'
      where i.id is null
    )
  then raise exception 'Lista de fijados no válida o desactualizada'; end if;
  update public.items i set pinned_order=ranked.position-1
  from unnest(p_item_ids) with ordinality as ranked(item_id, position)
  where i.id=ranked.item_id and i.user_id=v_user_id
    and i.pinned and (i.metadata->>'extra') is distinct from 'true';
end;
$function$;
revoke all on function public.set_pinned_order(uuid[]) from public;
grant execute on function public.set_pinned_order(uuid[]) to authenticated;
