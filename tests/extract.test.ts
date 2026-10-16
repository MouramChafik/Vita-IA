import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { mergeExtractions, splitPdf } from "../lib/extract";
import type { GuaranteeTable } from "../lib/schemas";

describe("splitPdf", () => {
  it("découpe un PDF de 4 pages en lots de 3 pages", async () => {
    const pdf = new Uint8Array(await readFile("public/documents/vita-notice-2026.pdf"));
    const batches = await splitPdf(pdf, 3);
    expect(batches.map((b) => [b.firstPage, b.lastPage])).toEqual([
      [1, 3],
      [4, 4],
    ]);
  });
});

describe("mergeExtractions", () => {
  const g = (soin: string, formule: string, valeur: number) => ({
    produit: "Gamme", categorie: "optique" as const, soin, formule, valeur, unite: "euros" as const, conditions: null, page: 1,
  });
  const part = (over: Partial<GuaranteeTable>): GuaranteeTable => ({ organisme: "", annee: null, formules: [], garanties: [], ...over });

  it("réunit formules et garanties sans doublon", () => {
    const merged = mergeExtractions([
      part({ organisme: "Orvalis 2026", formules: [{ produit: "Gamme", nom: "Essentiel", cotisation_mensuelle: null }], garanties: [g("Lunettes", "Essentiel", 100)] }),
      part({
        annee: 2026,
        formules: [{ produit: "Gamme", nom: "essentiel", cotisation_mensuelle: 21.9 }, { produit: "Gamme", nom: "Confort", cotisation_mensuelle: 36.4 }],
        garanties: [g("lunettes", "Essentiel", 999), g("Chambre", "Confort", 50)],
      }),
    ]);
    expect(merged.organisme).toBe("Orvalis");
    expect(merged.annee).toBe(2026);
    // la cotisation connue remplace null ; "essentiel" et "Essentiel" sont la même formule
    expect(merged.formules).toEqual([{ produit: "Gamme", nom: "Essentiel", cotisation_mensuelle: 21.9 }, { produit: "Gamme", nom: "Confort", cotisation_mensuelle: 36.4 }]);
    // le doublon (Lunettes, Essentiel) garde la première valeur
    expect(merged.garanties.map((x) => [x.soin, x.valeur])).toEqual([["Lunettes", 100], ["Chambre", 50]]);
  });
});
