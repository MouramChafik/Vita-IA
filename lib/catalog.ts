// Lecture du catalogue publié (documents + garanties extraites) pour la page /garanties.
//
// "use cache" : Next.js garde le résultat en cache, la page s'affiche sans interroger Supabase
// à chaque visite. cacheTag permet de vider ce cache quand on publie ou supprime un document
// (revalidateTag(CATALOG_TAG) dans /api/documents).

import { cacheTag } from "next/cache";
import { GuaranteeTableSchema, type GuaranteeTable } from "./schemas";
import { supabaseServer } from "./supabase-server";

export const CATALOG_TAG = "catalog";

export type PublishedDocument = {
  id: string;
  title: string;
  pageCount: number | null;
  createdAt: string;
  deletable: boolean; // publié depuis la page Extraction
  table: GuaranteeTable;
};

export async function getPublishedDocuments(): Promise<PublishedDocument[]> {
  "use cache";
  cacheTag(CATALOG_TAG);

  const { data, error } = await supabaseServer()
    .from("documents")
    .select("id, title, page_count, created_at, origin, extraction")
    .not("extraction", "is", null)
    .order("created_at", { ascending: false });

  // Colonne absente (migration 003 pas encore exécutée) ou autre erreur : catalogue vide
  if (error) {
    console.error("[catalog]", error.message);
    return [];
  }

  return (data ?? []).flatMap((d) => {
    // Revalidation : un JSON abîmé en base ne doit pas casser la page
    const table = GuaranteeTableSchema.safeParse(d.extraction);
    if (!table.success) return [];
    return [
      {
        id: d.id,
        title: d.title,
        pageCount: d.page_count,
        createdAt: d.created_at,
        deletable: d.origin === "extraction",
        table: table.data,
      },
    ];
  });
}
