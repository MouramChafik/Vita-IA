// Calcul des indicateurs de la page Supervision à partir de la table query_logs.
// Fonctions pures : faciles à tester, sans appel à Supabase.

import { NOT_FOUND } from "./prompt";

export type QueryLog = {
  id: number;
  question: string;
  answer: string | null;
  duration_ms: number | null;
  total_tokens: number | null;
  model: string | null;
  error: string | null;
  feedback?: number | null; // colonne ajoutée par supabase/migrations/002_feedback.sql
  created_at: string;
};

// Quotas gratuits connus (requêtes par jour). Google ne les expose pas par API :
// on compte nos propres appels. Les autres modèles n'ont pas de limite connue ici.
export const DAILY_LIMITS: Record<string, number> = { "gemini-2.5-flash": 20 };

// Les quotas Gemini repartent à zéro à minuit, heure du Pacifique.
// On calcule ce minuit-là, exprimé comme un instant précis (Date).
export function quotaDayStart(now: Date = new Date()): Date {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  // Temps écoulé depuis minuit à Los Angeles
  const sinceMidnight = (Number(parts.hour) * 3600 + Number(parts.minute) * 60 + Number(parts.second)) * 1000;
  return new Date(now.getTime() - sinceMidnight - now.getMilliseconds());
}

export function nextQuotaReset(now: Date = new Date()): Date {
  return new Date(quotaDayStart(now).getTime() + 24 * 3600 * 1000);
}

export function computeStats(logs: QueryLog[]) {
  const answered = logs.filter((l) => !l.error);
  const durations = answered.map((l) => l.duration_ms).filter((d): d is number => d !== null);

  const byModel: Record<string, number> = {};
  for (const l of logs) if (l.model) byModel[l.model] = (byModel[l.model] ?? 0) + 1;

  return {
    questions: logs.length,
    errors: logs.length - answered.length,
    refusals: answered.filter((l) => l.answer === NOT_FOUND).length,
    avgDurationMs: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null,
    tokens: logs.reduce((sum, l) => sum + (l.total_tokens ?? 0), 0),
    thumbsUp: logs.filter((l) => l.feedback === 1).length,
    thumbsDown: logs.filter((l) => l.feedback === -1).length,
    byModel,
  };
}
