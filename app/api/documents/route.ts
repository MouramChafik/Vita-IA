// Route Handler POST /api/documents : publie sur le site un PDF déjà extrait.
// Corps (multipart) : file (PDF), title, extraction (JSON renvoyé par /api/extract)
//
// Effets :
//  1. le PDF est indexé pour le RAG (découpage + embeddings) : Vita le connaît immédiatement ;
//  2. les garanties extraites sont enregistrées avec le document et affichées sur /garanties.
// On réutilise l'extraction déjà faite : pas de second appel à Gemini, le quota est préservé.

import { revalidateTag } from "next/cache";
import { z } from "zod";
import { MAX_PDF_BYTES } from "@/lib/extract";
import { CATALOG_TAG } from "@/lib/catalog";
import { ingestPdf } from "@/lib/ingest";
import { GuaranteeTableSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const title = z.string().trim().min(3).max(120).safeParse(form?.get("title"));

  if (!(file instanceof File) || file.type !== "application/pdf" || file.size > MAX_PDF_BYTES) {
    return Response.json({ error: "Ajoutez un PDF de 5 Mo maximum." }, { status: 400 });
  }
  if (!title.success) {
    return Response.json({ error: "Donnez un titre au document (3 à 120 caractères)." }, { status: 400 });
  }

  // L'extraction vient du navigateur : on la revalide avec Zod avant de l'enregistrer
  let extractionJson: unknown;
  try {
    extractionJson = JSON.parse(String(form?.get("extraction") ?? ""));
  } catch {
    extractionJson = null;
  }
  const extraction = GuaranteeTableSchema.safeParse(extractionJson);
  if (!extraction.success) {
    return Response.json({ error: "Les garanties extraites sont invalides. Relancez l'extraction." }, { status: 400 });
  }

  try {
    const safeName = `${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
    const result = await ingestPdf({
      pdf: new Uint8Array(await file.arrayBuffer()),
      fileName: safeName,
      title: title.data,
      extraction: extraction.data,
      origin: "extraction",
    });
    // La page /garanties est en cache : on l'invalide pour afficher le nouveau document
    revalidateTag(CATALOG_TAG, { expire: 0 });
    console.log("[documents] publié", { title: title.data, ...result });
    return Response.json({ ok: true, ...result });
  } catch (err) {
    console.error("[documents] Erreur", err instanceof Error ? err.message : err);
    return Response.json({ error: "La publication a échoué." }, { status: 500 });
  }
}
