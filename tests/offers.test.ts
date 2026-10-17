import { describe, expect, it } from "vitest";
import { assignPhotos, PHOTOS, themeFor } from "../lib/photos";
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

describe("photos", () => {
  it("déduit le thème des garanties quand le nom est générique", () => {
    expect(themeFor("Pack Confort", ["autre"], ["Indemnités journalières", "Rente d'invalidité"])).toBe("revenus");
    expect(themeFor("Formule Zen", ["autre"], ["Capital décès", "Rente éducation"])).toBe("deces");
  });

  it("ne réutilise pas une photo tant qu'il en reste dans le thème", () => {
    const items = Array.from({ length: 5 }, (_, i) => ({ key: `p${i}`, theme: "sante" as const }));
    const photos = assignPhotos(items);
    expect(new Set([...photos.values()].map((p) => p.src)).size).toBe(5);
  });

  it("dispose d'au moins 5 photos par thème, toutes créditées", () => {
    for (const list of Object.values(PHOTOS)) {
      expect(list.length).toBeGreaterThanOrEqual(5);
      for (const p of list) expect(p.author && p.page.startsWith("https://unsplash.com/photos/")).toBeTruthy();
    }
  });
});
