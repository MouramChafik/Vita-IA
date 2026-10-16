// Ingestion d'un PDF : texte par page -> passages -> embeddings -> Supabase.
// Utilisé par le script `npm run ingest` (et plus tard par la route /api/ingest).

import { extractText } from "unpdf";
import { chunkPages } from "./chunking";
import { embedDocuments } from "./gemini";
import { supabaseServer } from "./supabase-server";

// unpdf lit le PDF sans navigateur. mergePages: false => un texte par page (pour citer la page).
export async function extractPages(pdf: Uint8Array): Promise<string[]> {
  // On passe une copie : pdf.js transfère (et vide) le buffer qu'on lui donne
  const { text } = await extractText(pdf.slice(), { mergePages: false });
  return text;
}

export async function ingestPdf(params: {
  pdf: Uint8Array;
  fileName: string;
  title: string;
  sourceUrl?: string;
}) {
  const supabase = supabaseServer();

  // 1. Lecture et découpage
  const pages = await extractPages(params.pdf);
  const chunks = chunkPages(pages);
  if (chunks.length === 0) throw new Error("Aucun texte extrait : le PDF est peut-être scanné (image).");

  // 2. Embeddings de tous les passages (par lots de 100)
  const embeddings = await embedDocuments(chunks.map((c) => c.content));

  // 3. Ré-ingestion propre : on supprime l'ancienne version du même document
  //    (les chunks partent avec, grâce à "on delete cascade")
  await supabase.from("documents").delete().eq("title", params.title);

  // 4. Stockage du PDF dans le bucket privé
  const storagePath = params.fileName;
  const upload = await supabase.storage
    .from("documents")
    .upload(storagePath, params.pdf, { contentType: "application/pdf", upsert: true });
  if (upload.error) throw upload.error;

  // 5. Ligne "documents"
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .insert({ title: params.title, source_url: params.sourceUrl ?? null, storage_path: storagePath, page_count: pages.length })
    .select("id")
    .single();
  if (docError) throw docError;

  // 6. Lignes "chunks". pgvector accepte un vecteur écrit comme un tableau JSON "[0.1, 0.2, ...]".
  const rows = chunks.map((c, i) => ({
    document_id: doc.id,
    chunk_index: c.index,
    page: c.page,
    content: c.content,
    embedding: JSON.stringify(embeddings[i]),
  }));
  const { error: chunkError } = await supabase.from("chunks").insert(rows);
  if (chunkError) throw chunkError;

  return { documentId: doc.id as string, pages: pages.length, chunks: chunks.length };
}
