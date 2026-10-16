"use client";
// Choix d'un PDF (document de démo ou fichier personnel) -> appel à /api/extract -> tableau + JSON brut.
// Ensuite, « Publier sur le site » envoie le PDF et l'extraction à /api/documents :
// Vita indexe le document et ses garanties apparaissent sur la page /garanties.

import Link from "next/link";
import { useState } from "react";
import { aiUnavailableMessage } from "@/lib/ai-status-message";
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
  const [source, setSource] = useState<{ file: Blob; name: string } | null>(null); // PDF extrait, gardé pour la publication
  const [title, setTitle] = useState("");
  const [publish, setPublish] = useState<{ state: "idle" | "pending" | "done" | "error"; message?: string }>({ state: "idle" });

  async function publishDocument() {
    if (!source || !result) return;
    setPublish({ state: "pending" });
    const form = new FormData();
    form.append("file", source.file, source.name);
    form.append("title", title);
    // On envoie l'extraction déjà faite : pas de second appel à l'IA
    const { organisme, annee, formules, garanties } = result;
    form.append("extraction", JSON.stringify({ organisme, annee, formules, garanties }));
    const res = await fetch("/api/documents", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    setPublish(
      res.ok
        ? { state: "done", message: `Publié : ${data.chunks} passages indexés pour Vita.` }
        : { state: "error", message: data.error ?? "La publication a échoué." },
    );
  }

  async function extract(file: Blob, name: string) {
    setLoading(name);
    setError(null);
    setResult(null);
    setPublish({ state: "idle" });
    setSource({ file, name });
    try {
      const form = new FormData();
      form.append("file", file, name);
      const res = await fetch("/api/extract", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          aiUnavailableMessage({
            geminiStatus: data.geminiStatus,
            retryAfterSeconds: data.retryAfterSeconds,
            fallback: data.error ?? "L'extraction a échoué.",
          }),
        );
      }
      setResult(data);
      setTitle(data.annee ? `${data.organisme} ${data.annee}` : data.organisme);
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

          {/* Publication : le document rejoint le site et la base de connaissances de Vita */}
          <div className="mt-4 rounded-2xl border border-vita/25 bg-vita-soft/40 p-4">
            {publish.state === "done" ? (
              <p className="text-sm">
                {publish.message}{" "}
                <Link href="/garanties" className="font-semibold text-vita underline underline-offset-4">
                  Voir la page Garanties
                </Link>
              </p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  publishDocument();
                }}
                className="flex flex-wrap items-end gap-3"
              >
                <label className="min-w-0 flex-1 text-sm">
                  <span className="mb-1 block font-medium">Titre affiché sur le site</span>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    minLength={3}
                    maxLength={120}
                    className="w-full rounded-xl border border-line bg-white px-3 py-2"
                  />
                </label>
                <button
                  type="submit"
                  disabled={publish.state === "pending"}
                  className="rounded-full bg-vita px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
                >
                  {publish.state === "pending" ? "Publication…" : "Publier sur le site"}
                </button>
                <p className="w-full text-xs text-muted">
                  Le PDF est indexé pour Vita et ses garanties s&apos;affichent sur la page Garanties. Vous pourrez le supprimer depuis cette page.
                </p>
                {publish.state === "error" && <p className="w-full text-sm text-red-700">{publish.message}</p>}
              </form>
            )}
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
