// Client Supabase côté serveur, avec la clé secrète (service_role / sb_secret).
// Cette clé contourne RLS : elle ne doit JAMAIS arriver dans le navigateur.
import { createClient } from "@supabase/supabase-js";

export function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Variables Supabase manquantes dans .env.local");
  return createClient(url, key, { auth: { persistSession: false } });
}
