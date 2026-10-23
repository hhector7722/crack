-- Persist a per-user manual order for pinned cards.
alter table public.items
  add column if not exists pinned_order integer;

create or replace function public.set_pinned_order(p_item_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'Usuario no autenticado';
  end if;

  perform 1
  from public.items
  where user_id = v_user_id and pinned
  order by id
  for update;

  select count(*) into v_count
  from public.items
  where user_id = v_user_id and pinned;

  if p_item_ids is null
     or cardinality(p_item_ids) <> v_count
     or (select count(distinct pinned_id) from unnest(p_item_ids) as pinned_id) <> v_count
     or exists (
       select 1
       from unnest(p_item_ids) as x(pinned_id)
       left join public.items i
         on i.id = x.pinned_id and i.user_id = v_user_id and i.pinned
       where i.id is null
     )
  then
    raise exception 'Lista de fijados no válida o desactualizada';
  end if;

  update public.items i
  set pinned_order = ranked.position - 1
  from unnest(p_item_ids) with ordinality as ranked(item_id, position)
  where i.id = ranked.item_id and i.user_id = v_user_id and i.pinned;
end;
$function$;

revoke all on function public.set_pinned_order(uuid[]) from public;
grant execute on function public.set_pinned_order(uuid[]) to authenticated;