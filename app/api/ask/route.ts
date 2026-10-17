// Route Handler POST /api/ask : valide la question, lance le pipeline RAG et renvoie la réponse EN FLUX.
// S'exécute uniquement côté serveur : les clés Gemini et Supabase ne partent jamais au navigateur.
//
// Format de la réponse : NDJSON (un objet JSON par ligne), lu au fur et à mesure par le navigateur :
//   {"type":"status","step":"profile"}     Vita analyse la situation (mode orientation)
//   {"type":"status","step":"search"}      Vita cherche dans les documents
//   {"type":"status","step":"write"}       Vita rédige
//   {"type":"delta","text":"..."}          un morceau de texte
//   {"type":"done", answer, sources, followups, logId, model, quickReplies?, suggestions?}
//   {"type":"error", error, geminiStatus, retryAfterSeconds}

import { z } from "zod";
import { GeminiError, streamGenerate, type Usage } from "@/lib/gemini";
import { getOffers, productHref } from "@/lib/offers";
import {
  describeProfile,
  describeSuggestions,
  extractProfile,
  isOrientationRequest,
  ORIENTATION_MARKER,
  ORIENTATION_SYSTEM,
  questionsFor,
  suggest,
} from "@/lib/orientation";
import { buildPrompt } from "@/lib/prompt";
import { helpfulRefusal, isRefusal } from "@/lib/refusal";
import { finalize, generationInput, retrieve } from "@/lib/rag";
import { searchPassages, type Passage } from "@/lib/retrieval";
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
        // Mode orientation : demande de proposition, ou réponse à une question d'orientation de Vita
        const lastVita = [...history].reverse().find((t) => t.role === "vita")?.text ?? "";
        if (isOrientationRequest(question) || lastVita.includes(ORIENTATION_MARKER)) {
          await orient({ question, history, send, start });
          return;
        }

        // 1. Recherche
        send({ type: "status", step: "search" });
        const passages = await retrieve(question, history);

        // 2. Rien de pertinent : refus, sans appeler le modèle
        if (passages.length === 0) {
          const refusal = helpfulRefusal(question);
          const logId = await log({ question, answer: refusal.answer, chunkIds: [], durationMs: Date.now() - start });
          send({ type: "done", answer: refusal.answer, sources: [], followups: [], quickReplies: refusal.quickReplies, logId });
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
        const final = finalize(text, passages);
        // Le modèle a refusé (information absente des extraits) : on complète par un refus utile
        const refusal = isRefusal(final.answer) ? helpfulRefusal(question) : null;
        const answer = refusal?.answer ?? final.answer;
        const sources = refusal ? [] : final.sources;
        const followups = refusal ? [] : final.followups;
        const durationMs = Date.now() - start;
        const logId = await log({ question, answer, chunkIds: passages.map((p) => p.id), durationMs, usage, model });
        console.log("[ask]", { model, durationMs, passages: passages.length, cited: sources.length, tokens: usage?.totalTokenCount });
        send({ type: "done", answer, sources, followups, quickReplies: refusal?.quickReplies, logId, model });
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

// ---------- Mode orientation ----------
// 1. profil (LLM + Zod)  2. questions s'il manque l'essentiel  3. pistes (règles)  4. explication sourcée (LLM)
async function orient(ctx: {
  question: string;
  history: { role: "user" | "vita"; text: string }[];
  send: (event: object) => void;
  start: number;
}) {
  const { question, history, send, start } = ctx;

  send({ type: "status", step: "profile" });
  const profile = await extractProfile(history, question);

  // On ne pose les questions qu'une fois : ensuite on oriente avec ce qu'on sait
  const alreadyAsked = history.some((t) => t.role === "vita" && t.text.includes(ORIENTATION_MARKER));
  const questions = questionsFor(profile);
  if (questions.length > 0 && !alreadyAsked) {
    const answer = `${ORIENTATION_MARKER}, j'ai besoin de quelques précisions : ${questions.map((q) => q.text.toLowerCase().replace(/ \?$/, "")).join(" ; ")}.`;
    const logId = await log({ question, answer, chunkIds: [], durationMs: Date.now() - start });
    send({ type: "done", answer, sources: [], followups: [], logId, questions }); // affichées en formulaire
    return;
  }

  const suggestions = suggest(profile, await getOffers());
  if (suggestions.length === 0) {
    const answer = "Je n'ai pas trouvé de formule correspondant à cette situation dans les offres disponibles. Un conseiller pourra vous aider.";
    const logId = await log({ question, answer, chunkIds: [], durationMs: Date.now() - start });
    send({ type: "done", answer, sources: [], followups: [], logId });
    return;
  }

  // Extraits des documents pour chaque piste, afin que l'explication soit sourcée
  send({ type: "status", step: "search" });
  const passages: Passage[] = [];
  for (const s of suggestions) {
    for (const p of await searchPassages(`${s.productName} ${s.formule ?? ""} garanties remboursements`, 2, 0.4)) {
      if (!passages.some((x) => x.id === p.id)) passages.push(p);
    }
  }

  send({ type: "status", step: "write" });
  const prompt = `${describeProfile(profile)}\n\nPistes sélectionnées :\n${describeSuggestions(suggestions)}\n\n${buildPrompt(
    "Présente ces pistes à l'adhérent.",
    passages,
  )}`;
  let text = "";
  let usage: Usage | undefined;
  let model: string | undefined;
  for await (const chunk of streamGenerate({ system: ORIENTATION_SYSTEM, prompt })) {
    model = chunk.model;
    if (chunk.usage) usage = chunk.usage;
    if (chunk.text) {
      text += chunk.text;
      send({ type: "delta", text: chunk.text });
    }
  }

  const { answer, sources } = finalize(text, passages);
  const logId = await log({ question, answer, chunkIds: passages.map((p) => p.id), durationMs: Date.now() - start, usage, model });
  send({
    type: "done",
    answer,
    sources,
    followups: [],
    logId,
    model,
    // Cartes cliquables vers les produits proposés
    suggestions: suggestions.map((s) => ({
      href: productHref(s.offerKey, s.productSlug),
      organisme: s.organisme,
      productName: s.productName,
      formule: s.formule,
      prix: s.prix,
      kind: s.kind,
      raisons: s.raisons,
    })),
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
