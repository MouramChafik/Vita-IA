// Extraction des garanties d'un PDF en JSON structuré.
// Le PDF est envoyé à Gemini (inline_data), par lots de quelques pages :
// le modèle voit la mise en page des tableaux, et chaque lot reste assez court pour être extrait en entier.

import { PDFDocument } from "pdf-lib";
import { generateJson, type Usage } from "./gemini";
import { GEMINI_GUARANTEE_SCHEMA, GuaranteeTableSchema, type GuaranteeTable } from "./schemas";

const SYSTEM = `Tu extrais les garanties d'un document d'assurance santé français.
Règles :
- Une ligne par couple (soin, formule). Si un soin a trois formules, crée trois lignes.
- "valeur" est le nombre tel qu'écrit dans le document (150 pour "150 % BR", 200 pour "200 euros").
- Si un soin n'est pas couvert par une formule, mets valeur à null et unite à "non couvert".
- "Frais réels", "intégral" ou "100 % Santé sans reste à charge" signifient un remboursement complet : valeur à null et unite à "frais réels", jamais "non couvert".
- "conditions" résume les limites (plafond, délai, fréquence) ou vaut null.
- Un document peut présenter plusieurs produits (gammes, fiches produits). "produit" est le nom du produit auquel appartient la formule ou la garantie, écrit à l'identique partout. S'il n'y a qu'un produit, utilise son nom ou celui de l'organisme.
- "organisme" est le nom de l'assureur seul, sans année.
- "formules" liste les formules dans l'ordre du document, avec leur cotisation mensuelle en euros si elle est indiquée (sinon null).
- "soin" doit être court et identique pour les trois formules d'un même soin.
- N'invente rien : n'extrais que ce qui figure dans le document.`;

export const MAX_PDF_BYTES = 5 * 1024 * 1024; // limite raisonnable pour l'envoi inline

// Un long document envoyé d'un seul bloc donne une extraction incomplète : le modèle
// s'arrête sur les premières pages. On découpe donc le PDF en lots de quelques pages,
// on extrait chaque lot, puis on fusionne les résultats.
export const PAGES_PER_BATCH = 3;

// Découpe le PDF en petits PDF de `size` pages (pdf-lib copie les pages telles quelles)
export async function splitPdf(pdf: Uint8Array, size = PAGES_PER_BATCH): Promise<{ bytes: Uint8Array; firstPage: number; lastPage: number }[]> {
  const source = await PDFDocument.load(pdf);
  const total = source.getPageCount();
  const batches = [];
  for (let start = 0; start < total; start += size) {
    const indexes = Array.from({ length: Math.min(size, total - start) }, (_, i) => start + i);
    const part = await PDFDocument.create();
    const pages = await part.copyPages(source, indexes);
    pages.forEach((p) => part.addPage(p));
    batches.push({ bytes: await part.save(), firstPage: start + 1, lastPage: start + indexes.length });
  }
  return batches;
}

// Fusionne les extractions des lots :
// - formules : union, dans l'ordre d'apparition, en gardant la première cotisation connue ;
// - garanties : concaténées, un même couple (soin, formule) n'est gardé qu'une fois.
export function mergeExtractions(parts: GuaranteeTable[]): GuaranteeTable {
  const formules = new Map<string, GuaranteeTable["formules"][number]>();
  const garanties = new Map<string, GuaranteeTable["garanties"][number]>();
  for (const part of parts) {
    for (const f of part.formules) {
      const key = `${f.produit.toLowerCase()}|${f.nom.toLowerCase()}`;
      const known = formules.get(key);
      if (!known) formules.set(key, f);
      else if (known.cotisation_mensuelle === null && f.cotisation_mensuelle !== null) {
        formules.set(key, { ...known, cotisation_mensuelle: f.cotisation_mensuelle }); // on garde le nom d'origine
      }
    }
    for (const g of part.garanties) {
      const key = `${g.produit.toLowerCase()}|${g.soin.toLowerCase()}|${g.formule.toLowerCase()}`;
      if (!garanties.has(key)) garanties.set(key, g);
    }
  }
  const first = parts.find((p) => p.organisme) ?? parts[0];
  return {
    // Le modèle ajoute parfois l'année au nom : "Mutuelle Orvalis 2026" -> "Mutuelle Orvalis"
    organisme: (first?.organisme ?? "").replace(/\s*\b(19|20)\d{2}\b/g, "").trim(),
    annee: parts.find((p) => p.annee !== null)?.annee ?? null,
    formules: [...formules.values()],
    garanties: [...garanties.values()],
  };
}

async function extractBatch(pdf: Uint8Array, firstPage: number, lastPage: number, total: number) {
  const { json, usage, model } = await generateJson({
    system: SYSTEM,
    prompt:
      total === lastPage && firstPage === 1
        ? "Extrais toutes les garanties de ce document."
        : `Ce PDF contient les pages ${firstPage} à ${lastPage} d'un document de ${total} pages. ` +
          `Extrais toutes les garanties de ces pages. Pour "page", indique le numéro dans le document complet (entre ${firstPage} et ${lastPage}). ` +
          `Si ces pages ne contiennent aucune garantie, renvoie une liste "garanties" vide.`,
    schema: GEMINI_GUARANTEE_SCHEMA,
    pdf,
  });
  // Validation Zod : si le modèle renvoie un champ manquant ou une valeur hors liste, on le sait tout de suite
  const parsed = GuaranteeTableSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`JSON invalide renvoyé par le modèle (pages ${firstPage}-${lastPage}) : ${parsed.error.issues[0]?.message}`);
  }
  return { data: parsed.data, usage, model };
}

export async function extractGuarantees(pdf: Uint8Array): Promise<{ data: GuaranteeTable; usage: Usage; model: string }> {
  const batches = await splitPdf(pdf);
  const total = batches.at(-1)?.lastPage ?? 1;
  const parts: GuaranteeTable[] = [];
  const usage: Usage = { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 };
  const models = new Set<string>();

  // Un lot après l'autre : le palier gratuit limite le nombre de requêtes par minute
  for (const b of batches) {
    const r = await extractBatch(b.bytes, b.firstPage, b.lastPage, total);
    parts.push(r.data);
    models.add(r.model);
    usage.promptTokenCount! += r.usage.promptTokenCount ?? 0;
    usage.candidatesTokenCount! += r.usage.candidatesTokenCount ?? 0;
    usage.totalTokenCount! += r.usage.totalTokenCount ?? 0;
    console.log("[extract]", `pages ${b.firstPage}-${b.lastPage} : ${r.data.garanties.length} garanties (${r.model})`);
  }

  return { data: mergeExtractions(parts), usage, model: [...models].join(", ") };
}
