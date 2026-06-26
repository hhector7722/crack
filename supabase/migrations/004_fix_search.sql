-- Fix: Cast RRF score to float8 to match return type
-- The original 1.0 / integer returns numeric, but returns table expects float8

create or replace function public.search_items_v1(
  p_user_id   uuid,
  p_query     text,
  p_embedding vector(1536) default null,
  p_limit     int          default 20,
  p_rrf_k     int          default 60
)
returns table (
  id            uuid,
  type          text,
  title         text,
  content       text,
  file_url      text,
  metadata      jsonb,
  pinned        boolean,
  created_at    timestamptz,
  user_id       uuid,
  score         float8,
  search_source text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_tsquery tsquery;
begin
  begin
    v_tsquery := websearch_to_tsquery('crack_search', p_query);
  exception when others then
    v_tsquery := null;
  end;

  return query
  with
  fts_ranked as (
    select
      i.id,
      row_number() over (order by ts_rank_cd(i.fts, v_tsquery) desc) as rn
    from public.items i
    where i.user_id = p_user_id
      and v_tsquery is not null
      and i.fts @@ v_tsquery
    limit 50
  ),
  sem_ranked as (
    select
      i.id,
      row_number() over (order by i.embedding <=> p_embedding) as rn
    from public.items i
    where i.user_id = p_user_id
      and p_embedding is not null
      and i.embedding is not null
    order by i.embedding <=> p_embedding
    limit 50
  ),
  fused as (
    select
      coalesce(f.id, s.id) as id,
      (coalesce(1.0 / (p_rrf_k::float8 + f.rn), 0.0) +
       coalesce(1.0 / (p_rrf_k::float8 + s.rn), 0.0))::float8 as rrf_score,
      case
        when f.id is not null and s.id is not null then 'hybrid'
        when f.id is not null                      then 'fts'
        else                                            'semantic'
      end as search_source
    from fts_ranked f
    full outer join sem_ranked s on s.id = f.id
  )
  select
    i.id,
    i.type,
    i.title,
    i.content,
    i.file_url,
    i.metadata,
    i.pinned,
    i.created_at,
    i.user_id,
    fused.rrf_score as score,
    fused.search_source
  from fused
  join public.items i on i.id = fused.id
  order by fused.rrf_score desc
  limit p_limit;
end;
$$;

grant execute on function public.search_items_v1 to authenticated;
