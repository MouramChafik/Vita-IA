// Client Supabase côté serveur, avec la clé secrète (service_role / sb_secret).
// Cette clé contourne RLS : elle ne doit JAMAIS arriver dans le navigateur.
// SUPABASE_URL sans préfixe NEXT_PUBLIC_ : lue à l'exécution, jamais recopiée dans le code compilé.
import { createClient } from "@supabase/supabase-js";

export function supabaseServer() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Variables Supabase manquantes dans .env.local");
  return createClient(url, key, { auth: { persistSession: false } });
}
