// Extraction des garanties d'un PDF en JSON structuré.
// Le PDF est envoyé tel quel à Gemini (inline_data) : pas besoin de RAG pour un document court,
// le modèle voit tout le document, y compris la mise en page des tableaux.

import { generateJson, type Usage } from "./gemini";
import { GEMINI_GUARANTEE_SCHEMA, GuaranteeTableSchema, type GuaranteeTable } from "./schemas";

const SYSTEM = `Tu extrais les garanties d'un document d'assurance santé français.
Règles :
- Une ligne par couple (soin, formule). Si un soin a trois formules, crée trois lignes.
- "valeur" est le nombre tel qu'écrit dans le document (150 pour "150 % BR", 200 pour "200 euros").
- Si un soin n'est pas couvert par une formule, mets valeur à null et unite à "non couvert".
- "conditions" résume les limites (plafond, délai, fréquence) ou vaut null.
- N'invente rien : n'extrais que ce qui figure dans le document.`;

export const MAX_PDF_BYTES = 5 * 1024 * 1024; // limite raisonnable pour l'envoi inline

export async function extractGuarantees(pdf: Uint8Array): Promise<{ data: GuaranteeTable; usage: Usage; model: string }> {
  const { json, usage, model } = await generateJson({
    system: SYSTEM,
    prompt: "Extrais toutes les garanties de ce document.",
    schema: GEMINI_GUARANTEE_SCHEMA,
    pdf,
  });

  // Validation Zod : si le modèle renvoie un champ manquant ou une valeur hors liste, on le sait tout de suite
  const parsed = GuaranteeTableSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`JSON invalide renvoyé par le modèle : ${parsed.error.issues[0]?.message}`);
  }
  return { data: parsed.data, usage, model };
}
