// Pipeline RAG, partagé par la route /api/ask (en flux) et le script d'évaluation (en une fois).
// question -> passages proches (pgvector) -> prompt avec extraits -> Gemini -> réponse + sources

import { documentUrl } from "./documents";
import { generate, type Turn, type Usage } from "./gemini";
import { buildPrompt, citedNumbers, NOT_FOUND, splitFollowups, SYSTEM_PROMPT } from "./prompt";
import { searchPassages, type Passage } from "./retrieval";

export type Source = { n: number; title: string; page: number; excerpt: string; similarity: number; url: string | null };

export type RagAnswer = {
  answer: string;
  followups: string[];
  sources: Source[];
  passages: Passage[]; // tous les passages retrouvés (cités ou non)
  usage?: Usage;
  model?: string;
};

// Étape 1 : recherche des passages pertinents.
// Pour une relance courte (« et avec Sérénité ? »), on ajoute la question précédente
// de l'utilisateur, sinon la recherche n'aurait pas assez de contexte.
export async function retrieve(question: string, history: Turn[]): Promise<Passage[]> {
  const previousQuestion = [...history].reverse().find((t) => t.role === "user")?.text;
  const searchText = previousQuestion ? `${previousQuestion}\n${question}` : question;
  return searchPassages(searchText);
}

// Paramètres de génération : prompt avec extraits + historique.
// Les anciens [1], [2] renvoyaient à d'autres extraits : on les retire de l'historique.
export function generationInput(question: string, passages: Passage[], history: Turn[]) {
  return {
    system: SYSTEM_PROMPT,
    prompt: buildPrompt(question, passages),
    history: history.map((t) => ({ ...t, text: t.text.replace(/\[\d+\]/g, "") })),
  };
}

// Étape finale : sépare les relances et relie les numéros cités aux documents et pages.
export function finalize(text: string, passages: Passage[]) {
  const { answer, followups } = splitFollowups(text);
  const sources: Source[] = citedNumbers(answer)
    .filter((n) => n >= 1 && n <= passages.length)
    .map((n) => {
      const p = passages[n - 1];
      return {
        n,
        title: p.document_title,
        page: p.page,
        excerpt: p.content,
        similarity: p.similarity,
        url: documentUrl(p.document_title, p.page),
      };
    });
  return { answer, followups, sources };
}

// Version « en une fois », utilisée par l'évaluation
export async function answerQuestion(question: string, history: Turn[] = []): Promise<RagAnswer> {
  const passages = await retrieve(question, history);
  // Aucun passage assez proche : on ne laisse pas le modèle inventer
  if (passages.length === 0) return { answer: NOT_FOUND, followups: [], sources: [], passages };

  const { text, usage, model } = await generate(generationInput(question, passages, history));
  return { ...finalize(text, passages), passages, usage, model };
}
