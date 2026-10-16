// Route Handler POST /api/ask : le pipeline RAG complet.
// question -> embedding -> passages proches (pgvector) -> prompt avec extraits -> Gemini -> réponse + sources
// S'exécute uniquement côté serveur : les clés Gemini et Supabase ne partent jamais au navigateur.

import { GeminiError, generate } from "@/lib/gemini";
import { buildPrompt, citedNumbers, NOT_FOUND, SYSTEM_PROMPT } from "@/lib/prompt";
import { searchPassages } from "@/lib/retrieval";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question.trim().slice(0, 500) : "";
  if (!question) {
    return Response.json({ error: "Le champ 'question' est requis." }, { status: 400 });
  }

  const start = Date.now();
  try {
    // 1. Recherche des passages pertinents
    const passages = await searchPassages(question);

    // 2. Aucun passage assez proche : on ne laisse pas le modèle inventer
    if (passages.length === 0) {
      await log({ question, answer: NOT_FOUND, chunkIds: [], durationMs: Date.now() - start });
      return Response.json({ answer: NOT_FOUND, sources: [] });
    }

    // 3. Génération à partir des extraits
    const { text, usage, model } = await generate({ system: SYSTEM_PROMPT, prompt: buildPrompt(question, passages) });

    // 4. Sources : les extraits réellement cités par le modèle, numérotés comme dans la réponse
    const sources = citedNumbers(text)
      .filter((n) => n >= 1 && n <= passages.length)
      .map((n) => {
        const p = passages[n - 1];
        return { n, title: p.document_title, page: p.page, excerpt: p.content, similarity: p.similarity };
      });

    const durationMs = Date.now() - start;
    await log({ question, answer: text, chunkIds: passages.map((p) => p.id), durationMs, usage, model });
    console.log("[ask]", { model, durationMs, passages: passages.length, cited: sources.length, tokens: usage.totalTokenCount });

    return Response.json({ answer: text, sources, usage, model });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[ask] Erreur", message);
    await log({ question, chunkIds: [], durationMs: Date.now() - start, error: message });
    const geminiStatus = err instanceof GeminiError ? err.status : undefined;
    return Response.json({ error: "La réponse n'a pas pu être générée.", geminiStatus }, { status: 502 });
  }
}

// Journalisation dans query_logs (supervision). Une erreur de log ne doit pas casser la réponse.
async function log(entry: {
  question: string;
  answer?: string;
  chunkIds: number[];
  durationMs: number;
  usage?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };
  model?: string;
  error?: string;
}) {
  const { error } = await supabaseServer()
    .from("query_logs")
    .insert({
      question: entry.question,
      answer: entry.answer ?? null,
      chunk_ids: entry.chunkIds,
      duration_ms: entry.durationMs,
      prompt_tokens: entry.usage?.promptTokenCount ?? null,
      completion_tokens: entry.usage?.candidatesTokenCount ?? null,
      total_tokens: entry.usage?.totalTokenCount ?? null,
      model: entry.model ?? null,
      error: entry.error ?? null,
    });
  if (error) console.error("[ask] Log impossible", error.message);
}
