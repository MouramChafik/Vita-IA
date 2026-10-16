// Recherche des passages les plus proches d'une question (la partie "R" de RAG).
import { embedQuery } from "./gemini";
import { supabaseServer } from "./supabase-server";

export type Passage = {
  id: number;
  document_title: string;
  page: number;
  content: string;
  similarity: number; // 1 = sens identique, 0 = aucun rapport
};

export async function searchPassages(question: string, count = 5, minSimilarity = 0.5): Promise<Passage[]> {
  // 1. La question devient un vecteur, dans le même espace que les passages
  const embedding = await embedQuery(question);

  // 2. La fonction SQL match_chunks trie les passages par distance cosinus
  const { data, error } = await supabaseServer().rpc("match_chunks", {
    query_embedding: JSON.stringify(embedding),
    match_count: count,
    min_similarity: minSimilarity,
  });
  if (error) throw error;
  return data as Passage[];
}
