import { describe, expect, it } from "vitest";
import { GuaranteeTableSchema } from "../lib/schemas";

const valid = {
  organisme: "Vita Mutuelle",
  annee: 2026,
  formules: ["Essentielle", "Équilibre", "Sérénité"],
  garanties: [
    { categorie: "optique", soin: "Lunettes hors 100 % Santé", formule: "Équilibre", valeur: 200, unite: "euros par an", conditions: null, page: 1 },
    { categorie: "hospitalisation", soin: "Chambre particulière", formule: "Essentielle", valeur: null, unite: "non couvert", conditions: null, page: 1 },
  ],
};

describe("GuaranteeTableSchema", () => {
  it("accepte une extraction correcte", () => {
    expect(GuaranteeTableSchema.safeParse(valid).success).toBe(true);
  });

  it("rejette une catégorie inconnue", () => {
    const bad = structuredClone(valid);
    (bad.garanties[0] as { categorie: string }).categorie = "voyage";
    expect(GuaranteeTableSchema.safeParse(bad).success).toBe(false);
  });

  it("rejette un montant écrit en texte", () => {
    const bad = structuredClone(valid);
    (bad.garanties[0] as { valeur: unknown }).valeur = "200 euros";
    expect(GuaranteeTableSchema.safeParse(bad).success).toBe(false);
  });

  it("rejette un champ manquant", () => {
    const bad = structuredClone(valid) as { garanties: Record<string, unknown>[] };
    delete bad.garanties[0].formule;
    expect(GuaranteeTableSchema.safeParse(bad).success).toBe(false);
  });
});
