// Appels à l'API Gemini (côté serveur uniquement : Route Handlers et scripts).
// Ne jamais importer ce fichier dans un composant "use client".

const API = "https://generativelanguage.googleapis.com/v1beta";
// Modèles de génération, essayés dans l'ordre : si le premier est saturé (503)
// ou a épuisé son quota gratuit (429, 20 requêtes/jour sur gemini-2.5-flash), on passe au suivant.
export const GENERATION_MODELS = ["gemini-2.5-flash", "gemini-3.1-flash-lite", "gemini-3.5-flash"];
export const EMBEDDING_MODEL = "gemini-embedding-001";
export const EMBEDDING_DIM = 768; // doit correspondre à vector(768) dans supabase/schema.sql

export class GeminiError extends Error {
  constructor(public status: number, details: string) {
    super(`Gemini ${status}: ${details.slice(0, 300)}`);
  }
}

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY manquante côté serveur.");
  return key;
}

// POST vers Gemini, avec relance sur 429 (quota) et 503 (surcharge) : attente 1 s, 2 s, 4 s.
async function post<T>(path: string, body: unknown, retries = 3): Promise<T> {
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey() },
    body: JSON.stringify(body),
  };
  let res = await fetch(`${API}/${path}`, init);
  for (let attempt = 1; attempt <= retries && [429, 503].includes(res.status); attempt++) {
    await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));
    res = await fetch(`${API}/${path}`, init);
  }
  if (!res.ok) throw new GeminiError(res.status, await res.text());
  return res.json() as Promise<T>;
}

// ---------- Embeddings ----------
//
// taskType aide le modèle : un passage de document (RETRIEVAL_DOCUMENT) et une question
// (RETRIEVAL_QUERY) sont encodés un peu différemment pour mieux se « rencontrer ».

type EmbedTask = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

// Avec une dimension réduite (768 au lieu de 3072), Google recommande de normaliser
// le vecteur (longueur = 1) pour que la similarité cosinus reste fiable.
export function normalize(v: number[]): number[] {
  const norm = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
  return norm === 0 ? v : v.map((x) => x / norm);
}

function embedRequest(text: string, taskType: EmbedTask) {
  return {
    model: `models/${EMBEDDING_MODEL}`,
    content: { parts: [{ text }] },
    taskType,
    outputDimensionality: EMBEDDING_DIM,
  };
}

export async function embedQuery(text: string): Promise<number[]> {
  const data = await post<{ embedding: { values: number[] } }>(
    `models/${EMBEDDING_MODEL}:embedContent`,
    embedRequest(text, "RETRIEVAL_QUERY"),
  );
  return normalize(data.embedding.values);
}

// Plusieurs passages en un seul appel (100 maximum par lot).
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  const vectors: number[][] = [];
  for (let i = 0; i < texts.length; i += 100) {
    const batch = texts.slice(i, i + 100);
    const data = await post<{ embeddings: { values: number[] }[] }>(
      `models/${EMBEDDING_MODEL}:batchEmbedContents`,
      { requests: batch.map((t) => embedRequest(t, "RETRIEVAL_DOCUMENT")) },
    );
    vectors.push(...data.embeddings.map((e) => normalize(e.values)));
  }
  return vectors;
}

// ---------- Génération ----------

export type Usage = {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
};

export type Turn = { role: "user" | "vita"; text: string };

export async function generate(params: {
  system: string;
  prompt: string;
  history?: Turn[]; // échanges précédents de la conversation
  temperature?: number;
}): Promise<{ text: string; usage: Usage; model: string }> {
  // Gemini attend l'historique sous forme de tours "user" / "model"
  const previous = (params.history ?? []).map((t) => ({
    role: t.role === "user" ? "user" : "model",
    parts: [{ text: t.text }],
  }));
  const body = {
    systemInstruction: { parts: [{ text: params.system }] },
    contents: [...previous, { role: "user", parts: [{ text: params.prompt }] }],
    generationConfig: { temperature: params.temperature ?? 0.2 },
  };

  return callWithFallback(body);
}

// Essaie chaque modèle de GENERATION_MODELS jusqu'à ce que l'un réponde.
async function callWithFallback(body: unknown): Promise<{ text: string; usage: Usage; model: string }> {
  let lastError: unknown;
  for (const model of GENERATION_MODELS) {
    try {
      // Une seule relance par modèle : s'il reste saturé, on change de modèle plutôt que d'attendre
      const data = await post<{
        candidates?: { content?: { parts?: { text?: string }[] } }[];
        usageMetadata?: Usage;
      }>(`models/${model}:generateContent`, body, 1);
      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
      return { text, usage: data.usageMetadata ?? {}, model };
    } catch (err) {
      lastError = err;
      const temporary = err instanceof GeminiError && [429, 503].includes(err.status);
      if (!temporary) throw err;
      console.warn(`[gemini] ${model} indisponible (${(err as GeminiError).status}), modèle suivant`);
    }
  }
  throw lastError;
}

// ---------- Sortie structurée (JSON) ----------
//
// responseMimeType + responseSchema obligent Gemini à répondre avec un JSON qui respecte
// le schéma donné. On revalide quand même avec Zod côté appelant : on ne fait pas confiance
// aveuglément à la sortie d'un modèle.

export async function generateJson(params: {
  system: string;
  prompt: string;
  schema: object; // schéma au format OpenAPI attendu par Gemini
  pdf?: Uint8Array; // document envoyé directement au modèle (inline_data)
}): Promise<{ json: unknown; usage: Usage; model: string }> {
  const parts: object[] = [];
  if (params.pdf) {
    parts.push({ inline_data: { mime_type: "application/pdf", data: Buffer.from(params.pdf).toString("base64") } });
  }
  parts.push({ text: params.prompt });

  const { text, usage, model } = await callWithFallback({
    systemInstruction: { parts: [{ text: params.system }] },
    contents: [{ role: "user", parts }],
    generationConfig: { temperature: 0, responseMimeType: "application/json", responseSchema: params.schema },
  });
  return { json: JSON.parse(text), usage, model };
}
