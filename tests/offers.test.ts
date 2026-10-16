import { describe, expect, it } from "vitest";
import { themeFor } from "../components/ProductImage";
import { formatPrice, productsOf, shortName, slugify } from "../lib/offers";
import { VITA_TABLE } from "../lib/vita-catalog";

describe("offres", () => {
  it("raccourcit le nom quand la marque est répétée", () => {
    expect(shortName("Orvalis Santé Jeunes", "Mutuelle Orvalis")).toBe("Santé Jeunes");
    expect(shortName("Prévoyance Décès", "Mutuelle Orvalis")).toBe("Prévoyance Décès");
  });

  it("crée des slugs lisibles pour les URL", () => {
    expect(slugify("Orvalis Prévoyance Revenus (indépendants)")).toBe("orvalis-prevoyance-revenus-independants");
  });

  it("calcule le tarif de départ et les catégories d'un produit", () => {
    const [vita] = productsOf(VITA_TABLE);
    expect(vita.slug).toBe("vita-sante");
    expect(vita.minPrice).toBe(29);
    expect(vita.guaranteeCount).toBe(15);
    expect(vita.categories[0]).toBe("soins_courants");
  });

  it("formate les prix à la française", () => {
    expect(formatPrice(29)).toBe("29 €");
    expect(formatPrice(21.9)).toBe("21,90 €");
  });

  it("choisit l'illustration selon le nom du produit", () => {
    expect(themeFor("Orvalis Santé Senior")).toBe("senior");
    expect(themeFor("Orvalis Prévoyance Décès")).toBe("deces");
    expect(themeFor("Vita Santé")).toBe("sante");
  });
});
