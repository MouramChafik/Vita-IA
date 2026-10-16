-- Vote de l'utilisateur sur une réponse : 1 = utile, -1 = pas utile, null = pas de vote
-- À exécuter une fois dans Supabase : SQL Editor > New query > coller > Run.
alter table public.query_logs
  add column if not exists feedback smallint check (feedback in (-1, 1));
