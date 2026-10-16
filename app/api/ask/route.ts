// Route Handler POST /api/ask : valide la question, lance le pipeline RAG et renvoie la réponse EN FLUX.
// S'exécute uniquement côté serveur : les clés Gemini et Supabase ne partent jamais au navigateur.
//
// Format de la réponse : NDJSON (un objet JSON par ligne), lu au fur et à mesure par le navigateur :
//   {"type":"status","step":"search"}      Vita cherche dans les documents
//   {"type":"status","step":"write"}       Vita rédige
//   {"type":"delta","text":"..."}          un morceau de texte
//   {"type":"done", answer, sources, followups, logId, model}
//   {"type":"error", error, geminiStatus, retryAfterSeconds}

import { z } from "zod";
import { GeminiError, streamGenerate, type Usage } from "@/lib/gemini";
import { NOT_FOUND } from "@/lib/prompt";
import { finalize, generationInput, retrieve } from "@/lib/rag";
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
  const parsed = AskBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Le champ 'question' est requis (500 caractères maximum)." }, { status: 400 });
  }
  const { question, history } = parsed.data;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: object) => controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      const start = Date.now();

      try {
        // 1. Recherche
        send({ type: "status", step: "search" });
        const passages = await retrieve(question, history);

        // 2. Rien de pertinent : refus, sans appeler le modèle
        if (passages.length === 0) {
          const logId = await log({ question, answer: NOT_FOUND, chunkIds: [], durationMs: Date.now() - start });
          send({ type: "done", answer: NOT_FOUND, sources: [], followups: [], logId });
          return;
        }

        // 3. Génération en flux : chaque morceau est transmis immédiatement
        send({ type: "status", step: "write" });
        let text = "";
        let usage: Usage | undefined;
        let model: string | undefined;
        for await (const chunk of streamGenerate(generationInput(question, passages, history))) {
          model = chunk.model;
          if (chunk.usage) usage = chunk.usage;
          if (chunk.text) {
            text += chunk.text;
            send({ type: "delta", text: chunk.text });
          }
        }

        // 4. Réponse finale : relances séparées, sources reliées aux documents
        const { answer, followups, sources } = finalize(text, passages);
        const durationMs = Date.now() - start;
        const logId = await log({ question, answer, chunkIds: passages.map((p) => p.id), durationMs, usage, model });
        console.log("[ask]", { model, durationMs, passages: passages.length, cited: sources.length, tokens: usage?.totalTokenCount });
        send({ type: "done", answer, sources, followups, logId, model });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[ask] Erreur", message);
        await log({ question, chunkIds: [], durationMs: Date.now() - start, error: message });
        send({
          type: "error",
          error: "La réponse n'a pas pu être générée.",
          geminiStatus: err instanceof GeminiError ? err.status : undefined,
          retryAfterSeconds: err instanceof GeminiError ? err.retryAfterSeconds : undefined,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-cache" },
  });
}

// Journalisation dans query_logs (supervision). Renvoie l'id de la ligne, utilisé pour les votes 👍/👎.
// Une erreur de log ne doit pas casser la réponse.
async function log(entry: {
  question: string;
  answer?: string;
  chunkIds: number[];
  durationMs: number;
  usage?: Usage;
  model?: string;
  error?: string;
}): Promise<number | null> {
  const { data, error } = await supabaseServer()
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
    })
    .select("id")
    .single();
  if (error) console.error("[ask] Log impossible", error.message);
  return data?.id ?? null;
}
