-- Añade columna content_type a drops y relaja el constraint para permitir
-- file_url sin content en tipos no-texto.

alter table public.drops
  add column content_type text not null default 'text'
    check (content_type in ('text', 'image', 'audio', 'video', 'file'));

-- Reemplaza el constraint original que exigía content OR file_url,
-- ahora los tipos no-texto solo necesitan file_url.
alter table public.drops
  drop constraint drops_content_or_file_url_check;

alter table public.drops
  add constraint drops_content_or_file_url_check check (
    -- texto: necesita content
    (content_type = 'text' and nullif(btrim(coalesce(content, '')), '') is not null)
    -- resto: necesita file_url
    or (content_type <> 'text' and file_url is not null)
  );
