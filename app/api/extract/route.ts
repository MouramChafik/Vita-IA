// Route Handler POST /api/extract : reçoit un PDF (formulaire multipart, champ "file")
// et renvoie ses garanties au format JSON validé par Zod.

import { GeminiError } from "@/lib/gemini";
import { extractGuarantees, MAX_PDF_BYTES } from "@/lib/extract";

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "Ajoutez un fichier PDF dans le champ 'file'." }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return Response.json({ error: "Le fichier doit être un PDF." }, { status: 400 });
  }
  if (file.size > MAX_PDF_BYTES) {
    return Response.json({ error: "Le PDF dépasse 5 Mo." }, { status: 413 });
  }

  const start = Date.now();
  try {
    const pdf = new Uint8Array(await file.arrayBuffer());
    const { data, usage, model } = await extractGuarantees(pdf);
    console.log("[extract]", { file: file.name, model, durationMs: Date.now() - start, garanties: data.garanties.length });
    return Response.json({ ...data, usage, model });
  } catch (err) {
    console.error("[extract] Erreur", err instanceof Error ? err.message : err);
    const geminiStatus = err instanceof GeminiError ? err.status : undefined;
    const retryAfterSeconds = err instanceof GeminiError ? err.retryAfterSeconds : undefined;
    return Response.json({ error: "L'extraction a échoué.", geminiStatus, retryAfterSeconds }, { status: 502 });
  }
}
