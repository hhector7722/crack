-- Habilita Realtime para la tabla drops.
-- Sin esto los eventos INSERT no se emiten al canal de Realtime.

alter publication supabase_realtime add table public.drops;

-- REPLICA IDENTITY FULL asegura que los filtros sobre columnas no-PK
-- (como user_id) funcionen correctamente en postgres_changes.
alter table public.drops replica identity full;
