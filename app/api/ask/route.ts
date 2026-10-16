// Route Handler POST /api/ask : valide la question, lance le pipeline RAG (lib/rag.ts) et journalise.
// S'exécute uniquement côté serveur : les clés Gemini et Supabase ne partent jamais au navigateur.

import { GeminiError } from "@/lib/gemini";
import { answerQuestion } from "@/lib/rag";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase-server";

// Validation du corps de la requête avec Zod : on ne fait jamais confiance au navigateur
const AskBody = z.object({
  question: z.string().trim().min(1).max(500),
  history: z
    .array(z.object({ role: z.enum(["user", "vita"]), text: z.string().max(4000) }))
    .max(10)
    .default([]),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = AskBody.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Le champ 'question' est requis (500 caractères maximum)." }, { status: 400 });
  }
  const { question, history } = parsed.data;

  const start = Date.now();
  try {
    const { answer, sources, passages, usage, model } = await answerQuestion(question, history);
    const durationMs = Date.now() - start;
    await log({ question, answer, chunkIds: passages.map((p) => p.id), durationMs, usage, model });
    console.log("[ask]", { model, durationMs, passages: passages.length, cited: sources.length, tokens: usage?.totalTokenCount });
    return Response.json({ answer, sources, usage, model });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[ask] Erreur", message);
    await log({ question, chunkIds: [], durationMs: Date.now() - start, error: message });
    const geminiStatus = err instanceof GeminiError ? err.status : undefined;
    const retryAfterSeconds = err instanceof GeminiError ? err.retryAfterSeconds : undefined;
    return Response.json({ error: "La réponse n'a pas pu être générée.", geminiStatus, retryAfterSeconds }, { status: 502 });
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
