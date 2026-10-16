"use client";
// Tableau des garanties d'un produit.
// - Écran large : tableau comparatif, une colonne par formule, en-tête collant avec les tarifs.
// - Mobile : on choisit une formule, puis on lit la liste soin par soin (pas de défilement horizontal).

import { useState } from "react";
import AskVitaButton from "./vita/AskVitaButton";

export type ProductTableData = {
  organisme: string;
  produit: string;
  formules: { nom: string; prix: string | null }[];
  groups: { label: string; rows: { soin: string; detail: string | null; valeurs: string[] }[] }[];
};

// Valeur d'une cellule : « Non couvert » discret, « Frais réels » mis en avant
function Value({ v }: { v: string }) {
  if (v === "Non couvert" || v === "–") return <span className="text-muted/80">{v === "–" ? "Non précisé" : v}</span>;
  if (v === "Frais réels") return <span className="font-semibold text-teal">Frais réels</span>;
  return <span className="font-semibold tabular-nums">{v}</span>;
}

export default function ProductTable({ data }: { data: ProductTableData }) {
  const [selected, setSelected] = useState(Math.min(1, data.formules.length - 1)); // formule du milieu par défaut
  const ask = (soin: string) => `Comment est remboursé le poste « ${soin} » dans le produit ${data.produit} de ${data.organisme} ?`;

  return (
    <>
      {/* ---------- Mobile ---------- */}
      <div className="md:hidden">
        <div role="group" aria-label="Choisir une formule" className="grid gap-1 rounded-2xl bg-line/60 p-1" style={{ gridTemplateColumns: `repeat(${data.formules.length}, minmax(0, 1fr))` }}>
          {data.formules.map((f, i) => (
            <button
              key={f.nom}
              type="button"
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
              className={`rounded-xl px-2 py-2 text-center text-sm transition ${
                selected === i ? "bg-white font-semibold text-ink shadow-sm" : "text-muted"
              }`}
            >
              <span className="block truncate">{f.nom}</span>
              <span className="block text-[11px] font-normal text-muted">{f.prix ? `${f.prix} / mois` : "Tarif non indiqué"}</span>
            </button>
          ))}
        </div>

        {data.groups.map((group) => (
          <section key={group.label} className="mt-6">
            <h4 className="text-xs font-semibold text-teal">{group.label}</h4>
            <dl className="mt-2 divide-y divide-line border-y border-line">
              {group.rows.map((r) => (
                <div key={r.soin} className="flex items-start justify-between gap-4 py-3">
                  <dt className="min-w-0 text-sm">
                    <AskVitaButton question={ask(r.soin)} className="text-left font-medium underline decoration-vita/30 underline-offset-4">
                      {r.soin}
                    </AskVitaButton>
                    {r.detail && <span className="mt-0.5 block text-xs text-muted">{r.detail}</span>}
                  </dt>
                  <dd className="shrink-0 text-right text-sm">
                    <Value v={r.valeurs[selected]} />
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      {/* ---------- Écran large ---------- */}
      <table className="hidden w-full border-separate border-spacing-0 text-left text-sm md:table">
        <thead>
          <tr>
            <th scope="col" className="sticky top-[118px] z-10 w-[38%] border-b border-line bg-paper/95 px-4 pb-4 pt-5 align-bottom text-xs font-medium text-muted backdrop-blur">
              Garantie
            </th>
            {data.formules.map((f) => (
              <th key={f.nom} scope="col" className="sticky top-[118px] z-10 border-b border-line bg-paper/95 px-4 pb-4 pt-5 align-bottom backdrop-blur">
                <span className="block font-[family-name:var(--font-bricolage)] text-lg font-bold">{f.nom}</span>
                {f.prix ? (
                  <span className="mt-0.5 block text-sm font-normal text-muted">
                    <span className="font-semibold text-ink">{f.prix}</span> / mois
                  </span>
                ) : (
                  <span className="mt-0.5 block text-xs font-normal text-muted">Tarif non indiqué</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        {data.groups.map((group) => (
          <tbody key={group.label}>
            <tr>
              <th colSpan={data.formules.length + 1} scope="colgroup" className="px-4 pb-2 pt-7 text-xs font-semibold text-teal">
                {group.label}
              </th>
            </tr>
            {group.rows.map((r) => (
              <tr key={r.soin} className="group">
                <th scope="row" className="border-t border-line px-4 py-3.5 align-top font-normal group-hover:bg-white">
                  <AskVitaButton question={ask(r.soin)} className="text-left font-medium underline decoration-vita/25 underline-offset-4 hover:decoration-vita">
                    {r.soin}
                  </AskVitaButton>
                  {r.detail && <span className="mt-0.5 block text-xs text-muted">{r.detail}</span>}
                </th>
                {r.valeurs.map((v, i) => (
                  <td key={i} className="border-t border-line px-4 py-3.5 align-top group-hover:bg-white">
                    <Value v={v} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </>
  );
}
