import { describe, expect, it } from "vitest";
import { chunkPages, normalizeText, splitSentences } from "../lib/chunking";

describe("normalizeText", () => {
  it("recolle les mots coupés par une césure en fin de ligne", () => {
    expect(normalizeText("le rembour-\nsement")).toBe("le remboursement");
  });

  it("réduit les espaces multiples", () => {
    expect(normalizeText("tarif   de   convention")).toBe("tarif de convention");
  });
});

describe("splitSentences", () => {
  it("coupe sur la ponctuation et les sauts de ligne", () => {
    expect(splitSentences("Phrase un. Phrase deux ?\nTitre")).toEqual(["Phrase un.", "Phrase deux ?", "Titre"]);
  });
});

describe("chunkPages", () => {
  const sentence = (n: number) => `Phrase numéro ${n} sur les garanties optiques.`; // ~45 caractères

  it("garde un texte court en un seul passage", () => {
    const chunks = chunkPages(["Le ticket modérateur reste à charge."]);
    expect(chunks).toEqual([{ index: 0, page: 1, content: "Le ticket modérateur reste à charge." }]);
  });

  it("ne dépasse pas la taille maximale", () => {
    const text = Array.from({ length: 40 }, (_, i) => sentence(i)).join(" ");
    const chunks = chunkPages([text], { maxChars: 300, overlapChars: 0 });
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.content.length).toBeLessThanOrEqual(300);
  });

  it("ne coupe jamais une phrase en deux", () => {
    const text = Array.from({ length: 20 }, (_, i) => sentence(i)).join(" ");
    for (const c of chunkPages([text], { maxChars: 200 })) {
      expect(c.content.endsWith(".")).toBe(true);
    }
  });

  it("reprend la fin du passage précédent (chevauchement)", () => {
    const text = Array.from({ length: 20 }, (_, i) => sentence(i)).join(" ");
    const [first, second] = chunkPages([text], { maxChars: 200, overlapChars: 60 });
    const lastSentenceOfFirst = first.content.split(/(?<=\.) /).pop()!;
    expect(second.content.startsWith(lastSentenceOfFirst)).toBe(true);
  });

  it("attribue la bonne page et numérote dans l'ordre", () => {
    const chunks = chunkPages(["Page un.", "", "Page trois."]);
    expect(chunks.map((c) => [c.index, c.page])).toEqual([
      [0, 1],
      [1, 3],
    ]);
  });
});
