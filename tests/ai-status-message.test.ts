import { describe, expect, it } from "vitest";
import { aiUnavailableMessage, formatHour } from "../lib/ai-status-message";
import { parseRetryDelay } from "../lib/gemini";

const now = new Date(2026, 9, 16, 22, 30); // 16 octobre, 22 h 30 (heure locale)
const fallback = "Erreur";

describe("parseRetryDelay", () => {
  it("lit le délai dans le bloc RetryInfo d'une erreur 429", () => {
    const body = JSON.stringify({
      error: { code: 429, details: [{ "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "22007.4s" }] },
    });
    expect(parseRetryDelay(body)).toBe(22008);
  });

  it("renvoie undefined si le corps ne contient pas de délai", () => {
    expect(parseRetryDelay('{"error":{"code":503}}')).toBeUndefined();
    expect(parseRetryDelay("pas du JSON")).toBeUndefined();
  });
});

describe("aiUnavailableMessage", () => {
  it("formate l'heure à la française", () => {
    expect(formatHour(new Date(2026, 9, 17, 9, 5))).toBe("9 h 05");
  });

  it("annonce une attente courte en secondes", () => {
    expect(aiUnavailableMessage({ geminiStatus: 429, retryAfterSeconds: 30, fallback, now })).toBe(
      "Trop de questions en même temps. Réessayez dans 30 secondes.",
    );
  });

  it("annonce une attente en minutes avec l'heure de retour", () => {
    expect(aiUnavailableMessage({ geminiStatus: 429, retryAfterSeconds: 20 * 60, fallback, now })).toBe(
      "Le quota gratuit de l'IA est atteint. Le service revient dans environ 20 minutes, vers 22 h 50.",
    );
  });

  it("précise « demain » quand le retour est le lendemain", () => {
    const tenHours = 10 * 3600 + 32 * 60;
    expect(aiUnavailableMessage({ geminiStatus: 429, retryAfterSeconds: tenHours, fallback, now })).toBe(
      "Le quota gratuit de l'IA est épuisé pour aujourd'hui. Le service revient demain vers 9 h 02.",
    );
  });

  it("garde le message par défaut pour une autre erreur", () => {
    expect(aiUnavailableMessage({ geminiStatus: 400, fallback, now })).toBe("Erreur");
  });
});
