-- Búsqueda híbrida gratuita para Crack: Cloudflare BGE-M3 (1024 dimensiones).
-- No elimina ni transforma los embeddings históricos de OpenAI.
alter table public.items
  add column if not exists knowledge_embedding vector(1024);

create or replace function public.search_knowledge_v1(
  p_query text,
  p_embedding vector(1024) default null,
  p_limit integer default 25
)
returns table (
  id uuid,
  type text,
  title text,
  content text,
  file_url text,
  metadata jsonb,
  pinned boolean,
  created_at timestamptz,
  user_id uuid,
  score float8,
  search_source text
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_terms text;
  v_tsquery tsquery;
begin
  -- Las preguntas completas contienen muchas palabras de relleno.
  -- Un OR con los términos relevantes devuelve también enlaces y notas breves.
  select string_agg(term, ' | ') into v_terms
  from (
    select distinct word as term
    from regexp_split_to_table(
      regexp_replace(lower(left(p_query, 220)), '[^[:alnum:]áéíóúñü]+', ' ', 'g'),
      ' +'
    ) as word
    where length(word) >= 3
      and word not in (
        'que','qué','como','cómo','cual','cuál','cuales','cuáles','para','por','con',
        'una','uno','unos','unas','los','las','del','de','mis','tus','sus','sobre',
        'hay','era','son','fue','esto','esta','este','estos','estas','mejores',
        'tengo','guardado','guardada','guardados','guardadas','encuentra',
        'buscar','busca','dime','donde','dónde','puedo','podria','podría',
        'the','and','for','what','from','with','about'
      )
    limit 16
  ) terms;

  if v_terms is not null then
    begin
      v_tsquery := to_tsquery('crack_search', v_terms);
    exception when others then
      v_tsquery := null;
    end;
  end if;

  return query
  with lexical as (
    select i.id,
      row_number() over (
        order by ts_rank_cd(i.fts, v_tsquery) desc, i.created_at desc
      ) as rn
    from public.items i
    where i.user_id = (select auth.uid())
      and coalesce(i.metadata->>'extra','false') <> 'true'
      and v_tsquery is not null
      and i.fts @@ v_tsquery
    order by ts_rank_cd(i.fts, v_tsquery) desc, i.created_at desc
    limit 45
  ),
  semantic as (
    select i.id,
      row_number() over (order by i.knowledge_embedding <=> p_embedding) as rn
    from public.items i
    where i.user_id = (select auth.uid())
      and coalesce(i.metadata->>'extra','false') <> 'true'
      and p_embedding is not null
      and i.knowledge_embedding is not null
      and (i.knowledge_embedding <=> p_embedding) < 0.65
    order by i.knowledge_embedding <=> p_embedding
    limit 45
  ),
  fused as (
    select coalesce(l.id, s.id) as id,
      (coalesce(1.0/(60.0+l.rn),0.0) + coalesce(1.0/(60.0+s.rn),0.0))::float8 as rank_score,
      case when l.id is not null and s.id is not null then 'hybrid'
           when s.id is not null then 'semantic'
           else 'fts' end as source
    from lexical l full outer join semantic s on l.id=s.id
  )
  select i.id, i.type, i.title, i.content, i.file_url,
         i.metadata, i.pinned, i.created_at, i.user_id,
         f.rank_score, f.source
  from fused f
  join public.items i on i.id=f.id
  order by f.rank_score desc, i.created_at desc
  limit greatest(1,least(coalesce(p_limit,25),50));
end;
$$;

revoke all on function public.search_knowledge_v1(text,vector(1024),integer) from public;
grant execute on function public.search_knowledge_v1(text,vector(1024),integer) to authenticated;
