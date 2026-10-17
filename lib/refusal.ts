// Refus « utile » : quand l'information n'est pas dans les documents, Vita ne s'arrête pas à
// « je ne trouve pas » : elle dit ce qu'elle sait faire, oriente vers un conseiller si la demande
// en relève, et propose des questions pour repartir. Rien n'est inventé : ce texte est fixe.

import { NOT_FOUND } from "./prompt";

// La phrase de refus est conservée telle quelle en tête : l'évaluation la reconnaît
export function isRefusal(answer: string): boolean {
  return answer.trim().startsWith(NOT_FOUND);
}

// Demandes qui relèvent d'un conseiller : dossier personnel, contrat, démarches
const ADVISOR = /résili|resili|réclam|reclam|mon dossier|mon contrat|ma carte|tiers payant|mot de passe|mon compte|attestation|adhér|adher|devis|changer de formule|rembours(é|e)? (ma|mon|mes)|retard/i;

export const REFUSAL_REPLIES = [
  "Combien pour des lunettes avec la formule Équilibre ?",
  "Qu'est-ce qu'un ticket modérateur ?",
  "Quelle formule me conseillez-vous pour ma famille ?",
];

export function helpfulRefusal(question: string): { answer: string; quickReplies: string[] } {
  const lines = [NOT_FOUND, "", "Je peux vous aider sur vos remboursements, le détail des garanties et le choix d'une formule."];
  if (ADVISOR.test(question)) {
    lines.push(
      "Pour une démarche sur votre contrat ou votre dossier personnel (résiliation, réclamation, attestation, suivi d'un remboursement), un conseiller Vita Mutuelle pourra vous répondre.",
    );
  }
  return { answer: lines.join("\n"), quickReplies: REFUSAL_REPLIES };
}
