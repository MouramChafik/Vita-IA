// Construction du prompt RAG (la partie "AG" : Augmented Generation).
// Les passages trouvés sont numérotés [1], [2]... et le modèle doit citer ces numéros.
import type { Passage } from "./retrieval";

export const NOT_FOUND = "Je ne trouve pas cette information dans les documents de Vita Mutuelle.";

export const SYSTEM_PROMPT = `Tu es Vita, l'assistante de Vita Mutuelle (mutuelle fictive de démonstration).
Règles :
- Réponds UNIQUEMENT à partir des extraits fournis. N'utilise pas tes connaissances générales pour les chiffres ou les garanties.
- Après chaque information, cite l'extrait utilisé avec son numéro entre crochets, par exemple [1] ou [2][3].
- Si les extraits ne permettent pas de répondre, réponds exactement : "${NOT_FOUND}"
- Réponds en français, en phrases simples et courtes, en texte brut sans markdown.
- Ne demande jamais de donnée personnelle ou médicale.
- Si tu as pu répondre, termine par une dernière ligne au format exact :
SUIVI: première question courte | deuxième question courte
avec deux questions que l'adhérent pourrait poser ensuite et auxquelles les extraits permettent de répondre. Pas de ligne SUIVI après le refus.`;

export function buildPrompt(question: string, passages: Passage[]): string {
  const extraits = passages
    .map((p, i) => `[${i + 1}] (${p.document_title}, page ${p.page})\n${p.content}`)
    .join("\n\n");
  return `Extraits des documents :\n\n${extraits}\n\nQuestion : ${question}`;
}

// Numéros cités dans la réponse : "selon [1] et [3]" -> [1, 3]
export function citedNumbers(answer: string): number[] {
  const nums = [...answer.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]));
  return [...new Set(nums)].sort((a, b) => a - b);
}

// Sépare la réponse des questions de relance proposées par le modèle :
// "Réponse... [1]\nSUIVI: Question A ? | Question B ?" -> { answer, followups }
export function splitFollowups(text: string): { answer: string; followups: string[] } {
  const match = text.match(/\n?\s*SUIVI\s*:([\s\S]*)$/);
  if (!match) return { answer: text.trim(), followups: [] };
  const followups = match[1]
    .split("|")
    .map((q) => q.trim())
    .filter((q) => q.length > 0)
    .slice(0, 3);
  return { answer: text.slice(0, match.index).trim(), followups };
}
