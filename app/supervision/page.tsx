// Page Supervision : suivi de Vita en production, à partir de la table query_logs.
// Composant serveur : les données sont lues avec la clé secrète Supabase, jamais dans le navigateur.

import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import { formatHour } from "@/lib/ai-status-message";
import { supabaseServer } from "@/lib/supabase-server";
import { computeStats, DAILY_LIMITS, nextQuotaReset, quotaDayStart, type QueryLog } from "@/lib/supervision";
import { isAdmin } from "@/lib/admin";
import { login, logout } from "./actions";

export const metadata: Metadata = { title: "Supervision · Vita Mutuelle", robots: { index: false } };

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border-l-2 border-line pl-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-bricolage)] text-3xl font-bold tabular-nums">{value}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

function LoginForm({ error, configured }: { error: boolean; configured: boolean }) {
  return (
    <main className="mx-auto max-w-sm px-4 pt-20">
      <h1 className="text-3xl font-bold">Supervision</h1>
      {configured ? (
        <form action={login} className="mt-6 space-y-3">
          <label htmlFor="password" className="block text-sm font-medium">
            Mot de passe administrateur
          </label>
          <input id="password" name="password" type="password" required autoComplete="current-password" className="w-full rounded-xl border border-line bg-white px-3 py-2" />
          {error && <p className="text-sm text-red-700">Mot de passe incorrect.</p>}
          <button className="w-full rounded-xl bg-ink px-4 py-2.5 font-semibold text-white">Se connecter</button>
        </form>
      ) : (
        <p className="mt-4 text-muted">
          Ajoutez <code className="rounded bg-white px-1">ADMIN_PASSWORD=...</code> dans .env.local, puis redémarrez le serveur.
        </p>
      )}
    </main>
  );
}

export default async function SupervisionPage({ searchParams }: PageProps<"/supervision">) {
  if (!(await isAdmin())) {
    const { erreur } = await searchParams;
    return (
      <>
        <SiteHeader />
        <LoginForm error={erreur === "1"} configured={Boolean(process.env.ADMIN_PASSWORD)} />
      </>
    );
  }

  const supabase = supabaseServer();
  const dayStart = quotaDayStart();
  // select("*") : fonctionne même si la colonne feedback n'a pas encore été ajoutée
  const [{ data: today }, { data: recent }] = await Promise.all([
    supabase.from("query_logs").select("*").gte("created_at", dayStart.toISOString()).order("created_at", { ascending: false }),
    supabase.from("query_logs").select("*").order("created_at", { ascending: false }).limit(25),
  ]);
  const todayLogs = (today ?? []) as QueryLog[];
  const recentLogs = (recent ?? []) as QueryLog[];
  const stats = computeStats(todayLogs);
  const errors = recentLogs.filter((l) => l.error).slice(0, 5);
  const votes = stats.thumbsUp + stats.thumbsDown;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Supervision de Vita</h1>
            <p className="mt-2 text-muted">
              Journée de quota en cours depuis {formatHour(dayStart)}. Remise à zéro vers {formatHour(nextQuotaReset())}.
            </p>
          </div>
          <form action={logout}>
            <button className="text-sm font-semibold text-muted underline underline-offset-4 hover:text-ink">Se déconnecter</button>
          </form>
        </div>

        <section className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-5">
          <Stat label="Questions" value={String(stats.questions)} />
          <Stat label="Temps moyen" value={stats.avgDurationMs ? `${(stats.avgDurationMs / 1000).toFixed(1)} s` : "–"} />
          <Stat label="Tokens" value={stats.tokens.toLocaleString("fr-FR")} />
          <Stat label="Refus (hors documents)" value={String(stats.refusals)} />
          <Stat label="Erreurs" value={String(stats.errors)} />
        </section>

        <section className="mt-12 grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold">Utilisation par modèle</h2>
            <p className="mt-1 text-sm text-muted">Questions posées à Vita aujourd&apos;hui (hors évaluation et extraction).</p>
            <ul className="mt-4 space-y-4">
              {Object.keys({ ...DAILY_LIMITS, ...stats.byModel }).map((model) => {
                const used = stats.byModel[model] ?? 0;
                const limit = DAILY_LIMITS[model];
                const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : null;
                return (
                  <li key={model}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{model}</span>
                      <span className="tabular-nums text-muted">{limit ? `${used} / ${limit}` : `${used}`}</span>
                    </div>
                    {pct !== null && (
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line" role="meter" aria-valuenow={used} aria-valuemax={limit} aria-label={`Quota ${model}`}>
                        <div className={`h-full rounded-full ${pct >= 90 ? "bg-coral" : "bg-teal"}`} style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold">Avis des utilisateurs</h2>
            {votes === 0 ? (
              <p className="mt-2 text-sm text-muted">Aucun vote aujourd&apos;hui.</p>
            ) : (
              <>
                <p className="mt-2 text-sm text-muted">
                  {stats.thumbsUp} réponse(s) utile(s), {stats.thumbsDown} pas utile(s).
                </p>
                <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-line">
                  <div className="bg-teal" style={{ width: `${(100 * stats.thumbsUp) / votes}%` }} />
                  <div className="bg-coral" style={{ width: `${(100 * stats.thumbsDown) / votes}%` }} />
                </div>
              </>
            )}

            <h2 className="mt-8 text-xl font-bold">Dernières erreurs</h2>
            {errors.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Aucune erreur récente.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {errors.map((e) => (
                  <li key={e.id} className="rounded-lg bg-coral/15 px-3 py-2">
                    <span className="text-muted">{new Date(e.created_at).toLocaleString("fr-FR")} · </span>
                    {e.error?.slice(0, 120)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold">Dernières questions</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-paper text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Heure</th>
                  <th className="px-4 py-3 font-medium">Question</th>
                  <th className="px-4 py-3 font-medium">Modèle</th>
                  <th className="px-4 py-3 font-medium">Durée</th>
                  <th className="px-4 py-3 font-medium">Tokens</th>
                  <th className="px-4 py-3 font-medium">Avis</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((l) => (
                  <tr key={l.id} className="border-t border-line align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-muted">
                      {new Date(l.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3">
                      {l.question}
                      {l.error && <span className="block text-xs text-red-700">Erreur</span>}
                    </td>
                    <td className="px-4 py-3 text-muted">{l.model ?? "–"}</td>
                    <td className="px-4 py-3 tabular-nums">{l.duration_ms ? `${(l.duration_ms / 1000).toFixed(1)} s` : "–"}</td>
                    <td className="px-4 py-3 tabular-nums">{l.total_tokens ?? "–"}</td>
                    <td className="px-4 py-3">{l.feedback === 1 ? "👍" : l.feedback === -1 ? "👎" : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
