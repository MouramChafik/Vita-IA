// Route Handler POST /api/feedback : enregistre le vote 👍 / 👎 de l'utilisateur sur une réponse.
// Corps : { "logId": 42, "value": 1 }   (1 = utile, -1 = pas utile, null = annuler le vote)

import { z } from "zod";
import { supabaseServer } from "@/lib/supabase-server";

const FeedbackBody = z.object({
  logId: z.number().int().positive(),
  value: z.union([z.literal(1), z.literal(-1), z.null()]),
});

export async function POST(request: Request) {
  const parsed = FeedbackBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Vote invalide." }, { status: 400 });
  }

  const { error } = await supabaseServer()
    .from("query_logs")
    .update({ feedback: parsed.data.value })
    .eq("id", parsed.data.logId);

  if (error) {
    console.error("[feedback] Erreur", error.message);
    return Response.json({ error: "Le vote n'a pas pu être enregistré." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
