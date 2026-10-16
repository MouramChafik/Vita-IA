import { describe, expect, it } from "vitest";
import { NOT_FOUND } from "../lib/prompt";
import { computeStats, nextQuotaReset, quotaDayStart, type QueryLog } from "../lib/supervision";

describe("quotaDayStart", () => {
  it("renvoie minuit à Los Angeles (UTC-7 en été)", () => {
    // 16 octobre 2026, 20 h UTC = 13 h à Los Angeles -> minuit LA = 07:00 UTC
    expect(quotaDayStart(new Date("2026-10-16T20:00:00Z")).toISOString()).toBe("2026-10-16T07:00:00.000Z");
  });

  it("reste sur la veille avant minuit à Los Angeles", () => {
    // 05:00 UTC = 22 h la veille à Los Angeles
    expect(quotaDayStart(new Date("2026-10-17T05:00:00Z")).toISOString()).toBe("2026-10-16T07:00:00.000Z");
  });

  it("annonce la remise à zéro suivante 24 h plus tard", () => {
    expect(nextQuotaReset(new Date("2026-10-16T20:00:00Z")).toISOString()).toBe("2026-10-17T07:00:00.000Z");
  });
});

describe("computeStats", () => {
  const base = { answer: "ok", duration_ms: 1000, total_tokens: 100, model: "gemini-2.5-flash", error: null, feedback: null, created_at: "" };
  const logs: QueryLog[] = [
    { ...base, id: 1, question: "a", feedback: 1 },
    { ...base, id: 2, question: "b", duration_ms: 3000, model: "gemini-3.5-flash", feedback: -1 },
    { ...base, id: 3, question: "c", answer: NOT_FOUND, model: null, total_tokens: null },
    { ...base, id: 4, question: "d", answer: null, error: "Gemini 429", model: null, total_tokens: null },
  ];

  it("compte questions, erreurs, refus, votes et tokens", () => {
    const s = computeStats(logs);
    expect(s).toMatchObject({ questions: 4, errors: 1, refusals: 1, tokens: 200, thumbsUp: 1, thumbsDown: 1 });
    expect(s.byModel).toEqual({ "gemini-2.5-flash": 1, "gemini-3.5-flash": 1 });
  });

  it("calcule le temps moyen sans les erreurs", () => {
    expect(computeStats(logs).avgDurationMs).toBe(Math.round((1000 + 3000 + 1000) / 3));
  });
});
