import { describe, expect, it } from "vitest";
import { effectiveNeeds, isOrientationRequest, questionsFor, strength, suggest, type Profile } from "../lib/orientation";
import { productsOf, type Offer } from "../lib/offers";
import type { GuaranteeTable } from "../lib/schemas";
import { VITA_TABLE } from "../lib/vita-catalog";

// Petit catalogue de test : une gamme santé à 3 formules + deux produits de prévoyance
const g = (produit: string, soin: string, categorie: "optique" | "dentaire" | "hospitalisation", formule: string, valeur: number) => ({
  produit, categorie, soin, formule, valeur, unite: "% BR" as const, conditions: null, page: 1,
});
const ORVALIS: GuaranteeTable = {
  organisme: "Orvalis",
  annee: 2026,
  formules: [
    { produit: "Orvalis Santé", nom: "Essentiel", cotisation_mensuelle: 22 },
    { produit: "Orvalis Santé", nom: "Confort", cotisation_mensuelle: 36 },
    { produit: "Orvalis Santé", nom: "Premium", cotisation_mensuelle: 59 },
    { produit: "Orvalis Santé Jeunes", nom: "Jeunes", cotisation_mensuelle: 15 },
    { produit: "Orvalis Prévoyance Revenus", nom: "Option 1", cotisation_mensuelle: null },
    { produit: "Orvalis Prévoyance Décès", nom: "Niveau 1", cotisation_mensuelle: null },
  ],
  garanties: [
    ...["Essentiel", "Confort", "Premium"].flatMap((f, i) => [
      g("Orvalis Santé", "Lunettes", "optique", f, 100 + i * 100),
      g("Orvalis Santé", "Couronne", "dentaire", f, 125 + i * 100),
      g("Orvalis Santé", "Séjour", "hospitalisation", f, 100 + i * 50),
    ]),
    g("Orvalis Santé Jeunes", "Lunettes", "optique", "Jeunes", 150),
    { ...g("Orvalis Prévoyance Revenus", "Indemnités journalières", "hospitalisation", "Option 1", 50), categorie: "autre" as const },
    { ...g("Orvalis Prévoyance Décès", "Capital", "hospitalisation", "Niveau 1", 100), categorie: "autre" as const },
  ],
};
const offer = (key: string, table: GuaranteeTable): Offer => ({
  key, table, base: false, source: { title: "", url: "", pageCount: 1 }, products: productsOf(table),
});
const OFFERS = [offer("vita", VITA_TABLE), offer("orv", ORVALIS)];

// Le scénario de la demande : marié, deux enfants, épouse infirmière libérale de 47 ans
const famille: Profile = {
  personnes: [
    { role: "adherent", age: null, statut: "inconnu", profession: null },
    { role: "conjoint", age: 47, statut: "independant", profession: "infirmière libérale" },
    { role: "enfant", age: null, statut: "inconnu", profession: null },
    { role: "enfant", age: null, statut: "inconnu", profession: null },
  ],
  besoins: [],
  budget_mensuel: 120,
  pas_de_budget: false,
};

describe("orientation", () => {
  it("reconnaît une demande d'orientation", () => {
    expect(isOrientationRequest("Peux-tu me proposer une formule adaptée ?")).toBe(true);
    expect(isOrientationRequest("Je suis marié avec deux enfants, quelle offre nous conviendrait ?")).toBe(true);
    expect(isOrientationRequest("Quelle formule me conseillez-vous pour ma famille ?")).toBe(true);
    expect(isOrientationRequest("Qu'est-ce que le ticket modérateur ?")).toBe(false);
    expect(isOrientationRequest("Que propose ce contrat pour l'optique ?")).toBe(false);
    expect(isOrientationRequest("Quelle formule rembourse le mieux l'orthodontie ?")).toBe(false);
  });

  it("pose les questions manquantes, et seulement celles-là", () => {
    expect(questionsFor(famille).map((q) => q.text)).toEqual(["Quels soins comptent le plus pour vous ?"]);
    expect(questionsFor({ ...famille, besoins: ["optique"] })).toEqual([]);
    // plusieurs soins peuvent compter : choix multiple ; le budget : une seule réponse
    const q = questionsFor({ ...famille, budget_mensuel: null });
    expect(q.find((x) => x.id === "besoins")?.multiple).toBe(true);
    expect(q.find((x) => x.id === "budget")?.multiple).toBe(false);
  });

  it("déduit des besoins de la situation (enfants, 45 ans et plus)", () => {
    expect(effectiveNeeds(famille).sort()).toEqual(["dentaire", "hospitalisation", "optique", "soins_courants"]);
  });

  it("compare les garanties sur une même échelle", () => {
    expect(strength({ valeur: 200, unite: "% BR" })).toBe(2);
    expect(strength({ valeur: null, unite: "frais réels" })).toBeGreaterThan(strength({ valeur: 300, unite: "% BR" }));
    expect(strength({ valeur: null, unite: "non couvert" })).toBe(0);
  });

  it("propose des pistes santé et de prévoyance adaptées à la famille", () => {
    const s = suggest(famille, OFFERS);
    const sante = s.filter((x) => x.kind === "sante");
    const prev = s.filter((x) => x.kind === "prevoyance");

    expect(sante.length).toBeGreaterThan(0);
    expect(sante.length).toBeLessThanOrEqual(3);
    // pas de produit Jeunes pour un foyer avec une adulte de 47 ans
    expect(sante.some((x) => x.productName.includes("Jeunes"))).toBe(false);
    // l'infirmière libérale est indépendante : la prévoyance revenus arrive en premier
    expect(prev[0].productName).toMatch(/Revenus|Indépendants/);
    expect(prev[0].raisons[0]).toContain("infirmière libérale");
    expect(prev.some((x) => x.productName.includes("Décès"))).toBe(true);
    // une seule piste par type de protection, même si deux organismes en proposent
    expect(prev.filter((x) => /Revenus|Indépendants/.test(x.productName))).toHaveLength(1);
  });

  it("signale une formule au-dessus du budget", () => {
    const s = suggest({ ...famille, budget_mensuel: 40 }, OFFERS);
    expect(s.filter((x) => x.kind === "sante").every((x) => x.raisons.some((r) => r.includes("budget")))).toBe(true);
  });
});
