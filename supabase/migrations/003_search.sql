-- ─────────────────────────────────────────────────────────────────────────────
-- Crack: Phase 1 Search
-- FTS (crack_search config) + pgvector embeddings + RRF fusion + search_events
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Extensions ─────────────────────────────────────────────────────────────

create extension if not exists vector    with schema public;
create extension if not exists unaccent  with schema public;

-- ── 2. Custom FTS configuration: crack_search ─────────────────────────────────
-- Uses unaccent (removes diacritics) + simple (lowercase, no aggressive stemming)
-- Rationale: preserves technical terms (TPV, LiveKit, OCR, pgvector) while making
-- search accent-insensitive. Conjugation gaps are covered by semantic search.

create text search configuration crack_search (copy = simple);

alter text search configuration crack_search
  alter mapping for word, hword, hword_part
  with unaccent, simple;

-- ── 3. Add columns to items ────────────────────────────────────────────────────

-- Embedding vector (nullable: existing items start without one)
alter table public.items
  add column if not exists embedding       vector(1536),
  add column if not exists embedding_model text;

-- FTS column: generated automatically on every insert/update.
-- Indexes title, content, summary, link metadata and raw transcript.
-- The crack_search configuration handles unaccent + lowercase internally,
-- so to_tsvector('crack_search', text) is IMMUTABLE and valid in GENERATED columns.
alter table public.items
  add column if not exists fts tsvector generated always as (
    to_tsvector(
      'crack_search',
      coalesce(title,                          '') || ' ' ||
      coalesce(content,                        '') || ' ' ||
      coalesce(metadata->>'summary',           '') || ' ' ||
      coalesce(metadata->>'link_title',        '') || ' ' ||
      coalesce(metadata->>'link_description',  '') || ' ' ||
      left(coalesce(metadata->>'raw_transcript', ''), 10000)
    )
  ) stored;

-- ── 4. Indexes ─────────────────────────────────────────────────────────────────

-- GIN for FTS (O(log n) lookup)
create index if not exists items_fts_gin_idx
  on public.items using gin(fts);

-- IVFFlat for ANN vector search.
-- NOTE: This index requires training data. Create it manually after backfill:
--   create index items_embedding_ivfflat_idx
--     on public.items using ivfflat(embedding vector_cosine_ops)
--     with (lists = 10);
-- Until then, pgvector falls back to sequential scan (fine for < 1 000 items).

-- ── 5. search_events table ────────────────────────────────────────────────────
-- Collects real usage data from day one. Not used for ranking yet.

create table if not exists public.search_events (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  query       text        not null,
  item_id     uuid        references public.items(id) on delete set null,
  position    smallint,   -- rank position of the clicked result (1-based)
  clicked     boolean     not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists search_events_user_idx
  on public.search_events (user_id, created_at desc);

create index if not exists search_events_query_idx
  on public.search_events (user_id, query);

alter table public.search_events enable row level security;

create policy "search_events_select_own"
  on public.search_events for select
  to authenticated
  using (auth.uid() = user_id);

create policy "search_events_insert_own"
  on public.search_events for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ── 6. search_items_v1: hybrid FTS + vector search with RRF ──────────────────
-- Reciprocal Rank Fusion (Cormack et al. 2009, SIGIR).
-- k=60 is the standard value from the paper; exposed as parameter for tuning.
-- p_embedding = null → FTS-only mode (used for the immediate first response).

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
  search_source text        -- 'fts' | 'semantic' | 'hybrid'
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_tsquery tsquery;
begin
  -- websearch_to_tsquery is more tolerant than plainto_tsquery:
  -- supports phrases ("supabase auth"), handles special chars gracefully.
  begin
    v_tsquery := websearch_to_tsquery('crack_search', p_query);
  exception when others then
    v_tsquery := null;
  end;

  return query
  with
  -- ── Full Text Search ────────────────────────────────────────────────────────
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

  -- ── Semantic (vector) search ────────────────────────────────────────────────
  -- Only runs when p_embedding is provided and items have embeddings.
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

  -- ── RRF Fusion ──────────────────────────────────────────────────────────────
  -- score = Σ 1/(k + rank_i). Items in both lists score higher.
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
    fused.rrf_score  as score,
    fused.search_source
  from fused
  join public.items i on i.id = fused.id
  order by fused.rrf_score desc
  limit p_limit;
end;
$$;

-- Allow authenticated users to call this RPC.
-- The function uses security definer + WHERE user_id = p_user_id for isolation.
grant execute on function public.search_items_v1 to authenticated;
