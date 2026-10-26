-- Extracted PDF text is separate from user-authored notes, with page numbers.
create table if not exists public.pdf_pages (
  item_id uuid not null references public.items(id) on delete cascade,
  user_id uuid not null,
  page_number integer not null check (page_number between 1 and 2000),
  text_content text not null check (char_length(text_content) between 1 and 20000),
  extraction_method text not null check (extraction_method in ('text','ocr')),
  indexed_at timestamptz not null default now(),
  fts tsvector generated always as (to_tsvector('simple', coalesce(text_content,''))) stored,
  primary key(item_id,page_number)
);
create index if not exists pdf_pages_fts_idx on public.pdf_pages using gin (fts);
create index if not exists pdf_pages_owner_idx on public.pdf_pages (user_id,item_id);

alter table public.pdf_pages enable row level security;
revoke all on public.pdf_pages from public, anon;
grant select, insert, update, delete on public.pdf_pages to authenticated;

create policy pdf_pages_select_own on public.pdf_pages
for select to authenticated
using (user_id = (select auth.uid())
 and exists (select 1 from public.items i where i.id = item_id and i.user_id = (select auth.uid())
   and coalesce(i.metadata->>'extra','false') <> 'true'));
create policy pdf_pages_insert_own on public.pdf_pages
for insert to authenticated
with check (user_id = (select auth.uid())
 and exists (select 1 from public.items i where i.id = item_id and i.user_id = (select auth.uid())
   and i.type='file' and coalesce(i.metadata->>'extra','false') <> 'true'
   and lower(i.file_url) like '%.pdf'));
create policy pdf_pages_update_own on public.pdf_pages
for update to authenticated
using (user_id = (select auth.uid())
 and exists (select 1 from public.items i where i.id=item_id and i.user_id=(select auth.uid())
   and coalesce(i.metadata->>'extra','false') <> 'true'))
with check (user_id = (select auth.uid())
 and exists (select 1 from public.items i where i.id=item_id and i.user_id=(select auth.uid())
   and i.type='file' and coalesce(i.metadata->>'extra','false') <> 'true'));
create policy pdf_pages_delete_own on public.pdf_pages
for delete to authenticated
using (user_id=(select auth.uid()));

create or replace function public.search_pdf_pages_v1(p_query text,p_limit int default 16)
returns table(item_id uuid,page_number int,text_content text,score float8)
language sql stable security invoker set search_path=public
as $$
 with terms as (
  select string_agg(quote_literal(term),' | ') as txt
  from (
   select distinct word as term
   from regexp_split_to_table(
    regexp_replace(lower(left(coalesce(p_query,''),550)),'[^[:alnum:]áéíóúñü]+',' ','g'),
    ' +'
   ) word
   where length(word)>=3 and word not in ('que','como','cual','cuales','para','por','con','una',
   'unos','unas','los','las','del','de','mis','tus','sobre','hay','esta','este','esas','estos',
   'dime','buscar','busca','dice','pagina','paginas','archivo','documento','pdf','tengo','guardado')
   limit 14
  ) t
 ), words as (
  select case when txt is not null then to_tsquery('simple',txt) else null::tsquery end as ts
  from terms
 )
 select p.item_id,p.page_number,left(p.text_content,4500) as text_content,
 ts_rank_cd(p.fts,words.ts)::float8 as score
 from public.pdf_pages p cross join words
 join public.items i on i.id=p.item_id
 where p.user_id=(select auth.uid()) and i.user_id=(select auth.uid())
   and coalesce(i.metadata->>'extra','false') <> 'true'
   and words.ts is not null and p.fts @@ words.ts
 order by score desc,p.item_id,p.page_number
 limit greatest(1,least(coalesce(p_limit,16),35));
$$;
revoke all on function public.search_pdf_pages_v1(text,int) from public, anon;
grant execute on function public.search_pdf_pages_v1(text,int) to authenticated;
