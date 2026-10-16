// Route Handler POST /api/ask
// S'exécute uniquement côté serveur : la clé Gemini ne part jamais au navigateur.
// Étape 1 : on envoie la question telle quelle à Gemini (pas encore de RAG).

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export async function POST(request: Request) {
  // 1. Lire et valider le corps de la requête : { "question": "..." }
  const body = await request.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  if (!question) {
    return Response.json({ error: "Le champ 'question' est requis." }, { status: 400 });
  }

  // 2. Lire la clé (définie dans .env.local, sans préfixe NEXT_PUBLIC_)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "GEMINI_API_KEY manquante côté serveur." }, { status: 500 });
  }

  // 3. Appeler Gemini. "contents" = l'historique de conversation (ici un seul message).
  const start = Date.now();
  const requestInit: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey, // en en-tête plutôt que dans l'URL : la clé n'apparaît pas dans les logs d'URL
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: "Tu es un assistant qui répond en français, de façon claire et concise, aux questions sur l'assurance santé." }],
      },
      contents: [{ role: "user", parts: [{ text: question }] }],
      generationConfig: { temperature: 0.2 }, // faible = réponses plus stables, moins "créatives"
    }),
  };

  // Gemini renvoie parfois 503 (surcharge) ou 429 (quota par minute) : erreurs temporaires.
  // On réessaie jusqu'à 3 fois en attendant 1 s, puis 2 s, puis 4 s.
  let geminiResponse = await fetch(GEMINI_URL, requestInit);
  for (let attempt = 1; attempt <= 3 && [429, 503].includes(geminiResponse.status); attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** (attempt - 1)));
    geminiResponse = await fetch(GEMINI_URL, requestInit);
  }

  if (!geminiResponse.ok) {
    const details = await geminiResponse.text();
    console.error("[ask] Erreur Gemini", geminiResponse.status, details);
    return Response.json(
      { error: "Erreur lors de l'appel à Gemini.", geminiStatus: geminiResponse.status },
      { status: 502 },
    );
  }

  // 4. Extraire le texte : la réponse est dans candidates[0].content.parts[].text
  const data = await geminiResponse.json();
  const answer: string =
    data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";

  // Premier pas de supervision : durée et tokens consommés
  console.log("[ask]", { durationMs: Date.now() - start, usage: data.usageMetadata });

  return Response.json({ answer, usage: data.usageMetadata });
}
