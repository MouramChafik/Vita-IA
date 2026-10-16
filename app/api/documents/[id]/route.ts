// GET    /api/documents/:id  -> ouvre le PDF (lien temporaire vers Supabase Storage)
// PATCH  /api/documents/:id  -> relance l'extraction des garanties d'un document publié
// DELETE /api/documents/:id  -> supprime un document publié depuis la page Extraction
//
// Le bucket "documents" est privé : on crée un lien signé valable 10 minutes.
// Le "#page=3" ajouté au lien d'origine est conservé par le navigateur après la redirection.

import { revalidateTag } from "next/cache";
import { z } from "zod";
import { CATALOG_TAG } from "@/lib/catalog";
import { GeminiError } from "@/lib/gemini";
import { extractGuarantees } from "@/lib/extract";
import { supabaseServer } from "@/lib/supabase-server";

const Id = z.uuid();

async function findDocument(id: string) {
  const { data } = await supabaseServer()
    .from("documents")
    .select("id, storage_path, origin")
    .eq("id", id)
    .maybeSingle();
  return data as { id: string; storage_path: string | null; origin: string } | null;
}

export async function GET(_request: Request, ctx: RouteContext<"/api/documents/[id]">) {
  const { id } = await ctx.params;
  if (!Id.safeParse(id).success) return new Response("Document introuvable", { status: 404 });

  const doc = await findDocument(id);
  if (!doc?.storage_path) return new Response("Document introuvable", { status: 404 });

  const { data, error } = await supabaseServer().storage.from("documents").createSignedUrl(doc.storage_path, 600);
  if (error || !data) return new Response("PDF indisponible", { status: 500 });
  return Response.redirect(data.signedUrl, 302);
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/documents/[id]">) {
  const { id } = await ctx.params;
  if (!Id.safeParse(id).success) return Response.json({ error: "Document introuvable." }, { status: 404 });

  const doc = await findDocument(id);
  if (!doc) return Response.json({ error: "Document introuvable." }, { status: 404 });
  // Les documents de base (indexés par script) sont protégés
  if (doc.origin !== "extraction") {
    return Response.json({ error: "Seuls les documents ajoutés depuis l'extraction peuvent être supprimés." }, { status: 403 });
  }

  const supabase = supabaseServer();
  // Les passages (chunks) partent avec le document grâce à "on delete cascade" : Vita l'oublie
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) return Response.json({ error: "La suppression a échoué." }, { status: 500 });
  if (doc.storage_path) await supabase.storage.from("documents").remove([doc.storage_path]);

  revalidateTag(CATALOG_TAG, { expire: 0 });
  return Response.json({ ok: true });
}

export async function PATCH(_request: Request, ctx: RouteContext<"/api/documents/[id]">) {
  const { id } = await ctx.params;
  if (!Id.safeParse(id).success) return Response.json({ error: "Document introuvable." }, { status: 404 });

  const doc = await findDocument(id);
  if (!doc?.storage_path) return Response.json({ error: "Document introuvable." }, { status: 404 });
  if (doc.origin !== "extraction") {
    return Response.json({ error: "Seuls les documents ajoutés depuis l'extraction peuvent être réextraits." }, { status: 403 });
  }

  const supabase = supabaseServer();
  const { data: file, error: downloadError } = await supabase.storage.from("documents").download(doc.storage_path);
  if (downloadError || !file) return Response.json({ error: "PDF introuvable dans le stockage." }, { status: 500 });

  try {
    const { data, model } = await extractGuarantees(new Uint8Array(await file.arrayBuffer()));
    const { error } = await supabase.from("documents").update({ extraction: data }).eq("id", id);
    if (error) throw error;
    revalidateTag(CATALOG_TAG, { expire: 0 });
    return Response.json({ ok: true, garanties: data.garanties.length, model });
  } catch (err) {
    console.error("[documents] Réextraction", err instanceof Error ? err.message : err);
    return Response.json(
      {
        error: "La réextraction a échoué.",
        geminiStatus: err instanceof GeminiError ? err.status : undefined,
        retryAfterSeconds: err instanceof GeminiError ? err.retryAfterSeconds : undefined,
      },
      { status: 502 },
    );
  }
}
