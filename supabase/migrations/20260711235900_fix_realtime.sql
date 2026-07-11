-- =============================================================================
-- Fix: Asegura que Realtime funcione para la tabla drops
-- =============================================================================
-- Cómo ejecutar:
--   1. Abrir https://supabase.com/dashboard/project/ihewprxwxsxvhahtykfq/sql/new
--   2. Pegar este SQL
--   3. Ejecutar (Ctrl+Enter o Cmd+Enter)
--   4. Refrescar la página de la app
-- =============================================================================

-- 1. Añadir drops a la publicación supabase_realtime (idempotente)
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'drops'
  ) then
    alter publication supabase_realtime add table public.drops;
    raise notice '✓ drops añadida a supabase_realtime';
  else
    raise notice '✓ drops ya está en supabase_realtime';
  end if;
end;
$$;

-- 2. REPLICA IDENTITY FULL para que el filtro user_id funcione
do $$
begin
  if exists (
    select 1
    from pg_class
    where relname = 'drops'
      and relnamespace = (select oid from pg_namespace where nspname = 'public')
      and relreplident <> 'f'
  ) then
    alter table public.drops replica identity full;
    raise notice '✓ replica identity cambiado a FULL';
  else
    raise notice '✓ replica identity ya es FULL';
  end if;
end;
$$;

-- 3. Verificación
select
  tablename,
  'publication OK' as status
from pg_publication_tables
where pubname = 'supabase_realtime'
  and tablename = 'drops';
