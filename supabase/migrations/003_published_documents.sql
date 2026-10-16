-- Documents publiés depuis la page Extraction.
-- À exécuter une fois dans Supabase : SQL Editor > New query > coller > Run.

-- Garanties extraites par Gemini (JSON validé par Zod), affichées sur la page /garanties
alter table public.documents
  add column if not exists extraction jsonb;

-- Origine du document : 'script' (documents de base, protégés) ou 'extraction' (publié depuis le site, supprimable)
alter table public.documents
  add column if not exists origin text not null default 'script'
  check (origin in ('script', 'extraction'));
