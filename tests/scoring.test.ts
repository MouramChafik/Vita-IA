import { describe, expect, it } from "vitest";
import { splitFollowups } from "../lib/prompt";
import { containsAll, inventedNumbers, isRefusal, normalize, numbersIn } from "../eval/scoring";

describe("normalize", () => {
  it("unifie les écritures des montants et pourcentages", () => {
    expect(normalize("18.40€ et 150%")).toBe("18,40 euros et 150 %");
  });
});

describe("containsAll", () => {
  it("trouve les éléments attendus malgré la mise en forme", () => {
    expect(containsAll("Il reste 27,50 € à payer.", ["27,50 euros"])).toBe(true);
    expect(containsAll("Remboursé à 150%.", ["150 %"])).toBe(true);
  });

  it("échoue si un élément manque", () => {
    expect(containsAll("Remboursé à 150 %.", ["200 %"])).toBe(false);
  });
});

describe("isRefusal", () => {
  it("reconnaît la phrase de refus", () => {
    expect(isRefusal("Je ne trouve pas cette information dans les documents de Vita Mutuelle.")).toBe(true);
    expect(isRefusal("C'est remboursé à 100 %.")).toBe(false);
  });
});

describe("numbersIn / inventedNumbers", () => {
  it("ignore les marqueurs de citation", () => {
    expect(numbersIn("Forfait de 250 euros [2].")).toEqual(["250"]);
  });

  it("repère un nombre absent des extraits", () => {
    const context = "Forfait annuel de 120 euros avec Équilibre et de 250 euros avec Sérénité.";
    expect(inventedNumbers("Le forfait est de 250 euros [1].", context)).toEqual([]);
    expect(inventedNumbers("Le forfait est de 300 euros [1].", context)).toEqual(["300"]);
  });

  it("ne confond pas 20 avec 120", () => {
    expect(inventedNumbers("Il y a 20 points.", "Forfait de 120 euros.")).toEqual(["20"]);
  });
});

describe("splitFollowups", () => {
  it("sépare la réponse des questions de relance", () => {
    expect(splitFollowups("Remboursé à 150 % [1].\nSUIVI: Et avec Sérénité ? | Et pour l'OPTAM ?")).toEqual({
      answer: "Remboursé à 150 % [1].",
      followups: ["Et avec Sérénité ?", "Et pour l'OPTAM ?"],
    });
  });

  it("laisse la réponse intacte sans ligne SUIVI", () => {
    expect(splitFollowups("Je ne trouve pas cette information.")).toEqual({
      answer: "Je ne trouve pas cette information.",
      followups: [],
    });
  });
});
