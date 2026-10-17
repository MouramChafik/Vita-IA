import { describe, expect, it } from "vitest";
import { NOT_FOUND } from "../lib/prompt";
import { helpfulRefusal, isRefusal } from "../lib/refusal";
import { isRefusal as evalIsRefusal } from "../eval/scoring";

describe("refus utile", () => {
  it("garde la phrase de refus en tête (reconnue par l'évaluation)", () => {
    const { answer } = helpfulRefusal("Quel temps fera-t-il demain ?");
    expect(answer.startsWith(NOT_FOUND)).toBe(true);
    expect(isRefusal(answer)).toBe(true);
    expect(evalIsRefusal(answer)).toBe(true);
  });

  it("rappelle ce que Vita sait faire et propose des questions", () => {
    const r = helpfulRefusal("Écris-moi un poème");
    expect(r.answer).toContain("remboursements");
    expect(r.quickReplies).toHaveLength(3);
  });

  it("oriente vers un conseiller pour une démarche personnelle", () => {
    expect(helpfulRefusal("Comment résilier mon contrat ?").answer).toContain("conseiller");
    expect(helpfulRefusal("Quel temps fera-t-il demain ?").answer).not.toContain("conseiller");
  });

  it("ne confond pas une vraie réponse avec un refus", () => {
    expect(isRefusal("Remboursé à 150 % [1].")).toBe(false);
  });
});
