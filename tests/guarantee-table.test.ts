import { describe, expect, it } from "vitest";
import { buildComparison, formatValue, groupByCategory } from "../lib/guarantee-table";
import type { GuaranteeTable } from "../lib/schemas";

describe("formatValue", () => {
  it("formate pourcentages, montants et non couvert", () => {
    expect(formatValue({ valeur: 150, unite: "% BR" })).toBe("150 % BR");
    expect(formatValue({ valeur: 1000, unite: "euros" })).toBe("1 000 €");
    expect(formatValue({ valeur: 40, unite: "euros par jour" })).toBe("40 € / jour");
    expect(formatValue({ valeur: null, unite: "non couvert" })).toBe("Non couvert");
  });
});

describe("buildComparison", () => {
  const g = (soin: string, formule: string, valeur: number | null) => ({
    categorie: "optique" as const, soin, formule, valeur,
    unite: valeur === null ? ("non couvert" as const) : ("euros" as const), conditions: null, page: 1,
  });
  const table: GuaranteeTable = {
    organisme: "Vita Mutuelle",
    annee: 2026,
    formules: [{ nom: "Essentielle", cotisation_mensuelle: 29 }, { nom: "Équilibre", cotisation_mensuelle: null }],
    garanties: [g("Lunettes", "Équilibre", 200), g("Lunettes", "Essentielle", 100), g("Chambre", "essentielle", null)],
  };

  it("crée une ligne par soin et une colonne par formule, dans l'ordre", () => {
    const c = buildComparison(table);
    expect(c.formules).toEqual([{ nom: "Essentielle", prix: "29 €" }, { nom: "Équilibre", prix: null }]);
    expect(c.rows.map((r) => [r.soin, ...r.valeurs])).toEqual([
      ["Lunettes", "100 €", "200 €"],
      ["Chambre", "Non couvert", "–"],
    ]);
  });
});

describe("groupByCategory", () => {
  it("regroupe les lignes dans l'ordre des catégories", () => {
    const row = (categorie: "optique" | "soins_courants", soin: string) => ({ categorie, soin, detail: null, valeurs: [] });
    const groups = groupByCategory([row("optique", "Lunettes"), row("soins_courants", "Généraliste")]);
    expect(groups.map((g) => [g.label, g.rows.map((r) => r.soin)])).toEqual([
      ["Soins courants", ["Généraliste"]],
      ["Optique", ["Lunettes"]],
    ]);
  });
});
