// Transforme la liste des garanties extraites (une ligne par soin ET par formule)
// en tableau croisé pour la page d'accueil : une ligne par soin, une colonne par formule.

import type { Guarantee, GuaranteeTable } from "./schemas";

export type TableRow = { categorie: Guarantee["categorie"]; soin: string; detail: string | null; valeurs: string[] };
export type ComparisonTable = { formules: { nom: string; prix: string | null }[]; rows: TableRow[] };

const UNIT: Record<string, string> = {
  "% BR": "% BR",
  euros: "€",
  "euros par an": "€ / an",
  "euros par jour": "€ / jour",
};

// 150 + "% BR" -> "150 % BR" ; 1000 + "euros" -> "1 000 €"
export function formatValue(g: Pick<Guarantee, "valeur" | "unite">): string {
  if (g.valeur === null || g.unite === "non couvert") return "Non couvert";
  const n = g.valeur.toLocaleString("fr-FR").replace(/ /g, " ");
  return `${n} ${UNIT[g.unite] ?? g.unite}`.trim();
}

export function buildComparison(table: GuaranteeTable): ComparisonTable {
  const formules = table.formules.map((f) => ({
    nom: f.nom,
    prix: f.cotisation_mensuelle === null ? null : `${f.cotisation_mensuelle.toLocaleString("fr-FR")} €`,
  }));

  // Lignes dans l'ordre d'apparition des soins dans le document
  const rows = new Map<string, TableRow>();
  for (const g of table.garanties) {
    const row = rows.get(g.soin) ?? { categorie: g.categorie, soin: g.soin, detail: g.conditions, valeurs: formules.map(() => "–") };
    const col = formules.findIndex((f) => f.nom.toLowerCase() === g.formule.toLowerCase());
    if (col >= 0) row.valeurs[col] = formatValue(g);
    rows.set(g.soin, row);
  }
  return { formules, rows: [...rows.values()] };
}

export const CATEGORY_LABELS: Record<Guarantee["categorie"], string> = {
  soins_courants: "Soins courants",
  hospitalisation: "Hospitalisation",
  optique: "Optique",
  dentaire: "Dentaire",
  medecine_douce: "Médecine douce",
  autre: "Autres garanties",
};

// Regroupe les lignes par catégorie, dans un ordre fixe et lisible
export function groupByCategory(rows: TableRow[]): { categorie: Guarantee["categorie"]; label: string; rows: TableRow[] }[] {
  return (Object.keys(CATEGORY_LABELS) as Guarantee["categorie"][])
    .map((categorie) => ({ categorie, label: CATEGORY_LABELS[categorie], rows: rows.filter((r) => r.categorie === categorie) }))
    .filter((group) => group.rows.length > 0);
}
