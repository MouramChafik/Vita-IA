-- Schéma Supabase du RAG Vita
-- À exécuter une fois dans Supabase : SQL Editor > New query > coller > Run.

-- 1. Extension pgvector : ajoute le type "vector" et les opérateurs de distance
create extension if not exists vector with schema extensions;

-- 2. Documents sources (un PDF = une ligne)
create table if not exists public.documents (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  source_url  text,                      -- lien public d'origine (notice en ligne, Légifrance...)
  storage_path text,                     -- chemin du PDF dans Supabase Storage
  page_count  int,
  created_at  timestamptz not null default now()
);

-- 3. Passages découpés + leur embedding
-- 768 = outputDimensionality demandé à gemini-embedding-001 (doit correspondre exactement)
create table if not exists public.chunks (
  id          bigint generated always as identity primary key,
  document_id uuid not null references public.documents(id) on delete cascade,
  chunk_index int not null,              -- position du passage dans le document
  page        int,                       -- page d'origine, pour citer la source
  content     text not null,
  embedding   extensions.vector(768) not null,
  created_at  timestamptz not null default now(),
  unique (document_id, chunk_index)
);

-- Index HNSW : recherche approximative rapide par similarité cosinus
create index if not exists chunks_embedding_idx
  on public.chunks using hnsw (embedding extensions.vector_cosine_ops);

-- 4. Journal des requêtes (supervision et évaluation)
create table if not exists public.query_logs (
  id               bigint generated always as identity primary key,
  question         text not null,
  answer           text,
  chunk_ids        bigint[],             -- passages utilisés pour répondre
  duration_ms      int,
  prompt_tokens    int,
  completion_tokens int,
  total_tokens     int,
  model            text,
  error            text,
  feedback         smallint check (feedback in (-1, 1)), -- vote 👍 (1) / 👎 (-1)
  created_at       timestamptz not null default now()
);

-- 5. Fonction de recherche : renvoie les passages les plus proches d'un embedding de question
-- "<=>" = distance cosinus (0 = identique). similarité = 1 - distance.
create or replace function public.match_chunks(
  query_embedding extensions.vector(768),
  match_count int default 5,
  min_similarity float default 0.5
)
returns table (
  id bigint,
  document_id uuid,
  document_title text,
  page int,
  content text,
  similarity float
)
language sql stable
set search_path = public, extensions
as $$
  select
    c.id,
    c.document_id,
    d.title,
    c.page,
    c.content,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.chunks c
  join public.documents d on d.id = c.document_id
  where 1 - (c.embedding <=> query_embedding) >= min_similarity
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- 6. Sécurité : RLS activé sans aucune policy
-- => le navigateur (clé anon) ne peut rien lire ni écrire.
-- Seuls nos Route Handlers, avec la clé service_role (qui contourne RLS), accèdent aux données.
alter table public.documents  enable row level security;
alter table public.chunks     enable row level security;
alter table public.query_logs enable row level security;

revoke execute on function public.match_chunks(extensions.vector, int, float) from public, anon, authenticated;

-- 7. Bucket privé pour stocker les PDF
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;
