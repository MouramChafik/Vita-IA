// Pipeline RAG complet, partagé par la route /api/ask et le script d'évaluation.
// question -> passages proches (pgvector) -> prompt avec extraits -> Gemini -> réponse + sources

import { generate, type Turn, type Usage } from "./gemini";
import { buildPrompt, citedNumbers, NOT_FOUND, SYSTEM_PROMPT } from "./prompt";
import { searchPassages, type Passage } from "./retrieval";

export type Source = { n: number; title: string; page: number; excerpt: string; similarity: number };

export type RagAnswer = {
  answer: string;
  sources: Source[];
  passages: Passage[]; // tous les passages retrouvés (cités ou non)
  usage?: Usage;
  model?: string;
};

export async function answerQuestion(question: string, history: Turn[] = []): Promise<RagAnswer> {
  // 1. Recherche des passages pertinents.
  // Pour une relance courte (« et avec Sérénité ? »), on ajoute la question précédente
  // de l'utilisateur, sinon la recherche n'aurait pas assez de contexte.
  const previousQuestion = [...history].reverse().find((t) => t.role === "user")?.text;
  const searchText = previousQuestion ? `${previousQuestion}\n${question}` : question;
  const passages = await searchPassages(searchText);

  // 2. Aucun passage assez proche : on ne laisse pas le modèle inventer
  if (passages.length === 0) return { answer: NOT_FOUND, sources: [], passages };

  // 3. Génération à partir des extraits
  const { text, usage, model } = await generate({
    system: SYSTEM_PROMPT,
    prompt: buildPrompt(question, passages),
    // Les anciens [1], [2] renvoyaient à d'autres extraits : on les retire de l'historique
    history: history.map((t) => ({ ...t, text: t.text.replace(/\[\d+\]/g, "") })),
  });

  // 4. Sources : les extraits réellement cités, numérotés comme dans la réponse
  const sources = citedNumbers(text)
    .filter((n) => n >= 1 && n <= passages.length)
    .map((n) => {
      const p = passages[n - 1];
      return { n, title: p.document_title, page: p.page, excerpt: p.content, similarity: p.similarity };
    });

  return { answer: text, sources, passages, usage, model };
}
