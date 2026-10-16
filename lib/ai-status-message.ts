// Message affiché à l'utilisateur quand l'IA est indisponible.
// Fonction pure (pas d'appel réseau) : utilisable côté navigateur et facile à tester.

// 9 h 05, à la française
export function formatHour(date: Date): string {
  return `${date.getHours()} h ${String(date.getMinutes()).padStart(2, "0")}`;
}

export function aiUnavailableMessage(params: {
  geminiStatus?: number;
  retryAfterSeconds?: number;
  fallback: string; // message par défaut si l'erreur ne vient pas du quota
  now?: Date;
}): string {
  const { geminiStatus, retryAfterSeconds, fallback } = params;
  const now = params.now ?? new Date();

  if (geminiStatus === 503) {
    return "Le service d'IA est très sollicité en ce moment. Réessayez dans quelques secondes.";
  }
  if (geminiStatus !== 429) return fallback;

  if (retryAfterSeconds === undefined) {
    return "Le quota gratuit de l'IA est épuisé. Réessayez un peu plus tard.";
  }

  // Limite par minute : l'attente est courte
  if (retryAfterSeconds < 90) {
    return `Trop de questions en même temps. Réessayez dans ${retryAfterSeconds} secondes.`;
  }

  const back = new Date(now.getTime() + retryAfterSeconds * 1000);
  const minutes = Math.round(retryAfterSeconds / 60);

  if (minutes < 60) {
    return `Le quota gratuit de l'IA est atteint. Le service revient dans environ ${minutes} minutes, vers ${formatHour(back)}.`;
  }

  const tomorrow = back.toDateString() !== now.toDateString();
  return `Le quota gratuit de l'IA est épuisé pour aujourd'hui. Le service revient ${tomorrow ? "demain " : ""}vers ${formatHour(back)}.`;
}
