"use client";
// Choix d'un PDF (document de démo ou fichier personnel) -> appel à /api/extract -> tableau + JSON brut.

import { useState } from "react";
import type { GuaranteeTable } from "@/lib/schemas";

const DEMOS = [
  { label: "Tableau des garanties 2026", file: "/documents/vita-tableau-garanties-2026.pdf" },
  { label: "Notice d'information 2026", file: "/documents/vita-notice-2026.pdf" },
];

const UNIT_LABEL: Record<string, string> = {
  "% BR": "% BR",
  euros: "€",
  "euros par an": "€ / an",
  "euros par jour": "€ / jour",
};

export default function ExtractionTool() {
  const [result, setResult] = useState<(GuaranteeTable & { model?: string }) | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);

  async function extract(file: Blob, name: string) {
    setLoading(name);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file, name);
      const res = await fetch("/api/extract", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.geminiStatus === 429
            ? "Le quota gratuit de l'IA est atteint pour aujourd'hui. Réessayez demain."
            : (data.error ?? "L'extraction a échoué."),
        );
      }
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(null);
    }
  }

  async function extractDemo(demo: (typeof DEMOS)[number]) {
    const blob = await fetch(demo.file).then((r) => r.blob());
    extract(new Blob([blob], { type: "application/pdf" }), demo.label + ".pdf");
  }

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-center gap-3">
        {DEMOS.map((d) => (
          <button
            key={d.file}
            onClick={() => extractDemo(d)}
            disabled={loading !== null}
            className="rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
          >
            {loading === d.label + ".pdf" ? "Extraction en cours…" : `Extraire : ${d.label}`}
          </button>
        ))}
        <label className="cursor-pointer rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold hover:border-ink/40">
          Choisir un PDF (5 Mo max)
          <input
            type="file"
            accept="application/pdf"
            className="sr-only"
            disabled={loading !== null}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) extract(f, f.name);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <p className="mt-3 text-xs text-muted">N&apos;envoyez que des documents publics, jamais de document personnel ou médical.</p>

      {error && <p className="mt-6 rounded-xl border border-coral bg-coral/15 px-4 py-3 text-sm">{error}</p>}

      {result && (
        <section className="mt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-bold">
              {result.organisme}
              {result.annee ? ` · ${result.annee}` : ""}
            </h2>
            <p className="text-sm text-muted">
              {result.garanties.length} garanties extraites{result.model ? ` avec ${result.model}` : ""}
            </p>
          </div>

          <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-paper text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Catégorie</th>
                  <th className="px-4 py-3 font-medium">Soin</th>
                  <th className="px-4 py-3 font-medium">Formule</th>
                  <th className="px-4 py-3 font-medium">Remboursement</th>
                  <th className="px-4 py-3 font-medium">Page</th>
                </tr>
              </thead>
              <tbody>
                {result.garanties.map((g, i) => (
                  <tr key={i} className="border-t border-line align-top">
                    <td className="px-4 py-3 text-muted">{g.categorie.replace("_", " ")}</td>
                    <td className="px-4 py-3">
                      {g.soin}
                      {g.conditions && <span className="block text-xs text-muted">{g.conditions}</span>}
                    </td>
                    <td className="px-4 py-3">{g.formule}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {g.valeur === null ? <span className="text-muted">Non couvert</span> : `${g.valeur} ${UNIT_LABEL[g.unite] ?? g.unite}`}
                    </td>
                    <td className="px-4 py-3 text-muted">{g.page ?? "?"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={() => setShowJson((v) => !v)} className="mt-4 text-sm font-semibold text-vita underline underline-offset-4">
            {showJson ? "Masquer le JSON" : "Voir le JSON brut"}
          </button>
          {showJson && (
            <pre className="mt-3 max-h-96 overflow-auto rounded-2xl bg-ink p-4 text-xs text-white/90">
              {JSON.stringify({ organisme: result.organisme, annee: result.annee, formules: result.formules, garanties: result.garanties }, null, 2)}
            </pre>
          )}
        </section>
      )}
    </div>
  );
}
