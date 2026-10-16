// Fonctions de notation de l'évaluation (pures, donc testables avec Vitest).

import { NOT_FOUND } from "../lib/prompt";

// Met deux textes dans la même forme avant de les comparer :
// minuscules, espaces insécables, "€" -> "euros", "150%" -> "150 %", "18.40" -> "18,40".
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[  ]/g, " ")
    .replace(/€/g, " euros")
    .replace(/\s*%/g, " %")
    .replace(/(\d)\.(\d)/g, "$1,$2")
    .replace(/\s+/g, " ")
    .trim();
}

export function isRefusal(answer: string): boolean {
  return normalize(answer).includes(normalize(NOT_FOUND));
}

// La réponse contient-elle toutes les informations attendues ?
export function containsAll(answer: string, expected: string[]): boolean {
  const a = normalize(answer);
  return expected.every((e) => a.includes(normalize(e)));
}

// Nombres présents dans la réponse, sans les marqueurs de citation [1], [2]...
export function numbersIn(text: string): string[] {
  const withoutCitations = normalize(text).replace(/\[\d+\]/g, " ");
  return [...new Set(withoutCitations.match(/\d+(?:,\d+)?/g) ?? [])];
}

// Détection simple d'invention : chaque nombre de la réponse doit apparaître
// dans les extraits fournis au modèle (ou dans la question). Sinon, il vient de nulle part.
export function inventedNumbers(answer: string, context: string): string[] {
  const ctx = normalize(context);
  return numbersIn(answer).filter((n) => !new RegExp(`(^|[^\\d,])${n}([^\\d]|,(?!\\d)|$)`).test(ctx));
}
