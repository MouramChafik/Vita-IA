// Page /garanties : les produits publiés depuis la page Extraction.
// Pour chaque document : formules et tarifs, puis garanties regroupées par catégorie.
// Les données viennent de Supabase via getPublishedDocuments() (mis en cache, vidé à chaque publication).

import type { Metadata } from "next";
import Link from "next/link";
import DocumentActions from "@/components/DocumentActions";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import AskVitaButton from "@/components/vita/AskVitaButton";
import { getPublishedDocuments } from "@/lib/catalog";
import {
  buildComparison,
  groupByCategory,
  listProducts,
} from "@/lib/guarantee-table";

export const metadata: Metadata = { title: "Garanties · Vita Mutuelle" };

export default async function GarantiesPage() {
  const documents = await getPublishedDocuments();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6">
        <h1 className="text-3xl font-bold sm:text-4xl">Garanties et tarifs</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Chaque produit ci-dessous a été extrait automatiquement d&apos;un PDF.
          Vita connaît ces documents et peut répondre à vos questions en citant
          la page.
        </p>

        {documents.length === 0 ? (
          <section className="mt-12 rounded-3xl border border-dashed border-line bg-white px-6 py-12 text-center">
            <h2 className="text-xl font-bold">
              Aucun produit publié pour l&apos;instant
            </h2>
            <p className="mx-auto mt-2 max-w-md text-muted">
              Extrayez les garanties d&apos;un tableau de garanties, puis
              publiez-le : il apparaîtra ici.
            </p>
            <Link
              href="/extraction"
              className="mt-6 inline-block rounded-full bg-teal px-5 py-2.5 font-semibold text-white hover:brightness-110"
            >
              Extraire un PDF
            </Link>
          </section>
        ) : (
          documents.map((doc) => {
            const products = listProducts(doc.table);
            return (
              <section
                key={doc.id}
                className="mt-14 border-t border-line pt-10"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold sm:text-3xl">
                      {doc.table.organisme}
                      {doc.table.annee ? (
                        <span className="font-medium text-muted">
                          {" "}
                          {doc.table.annee}
                        </span>
                      ) : null}
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      Source :{" "}
                      <a
                        href={`/api/documents/${doc.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-2 hover:text-ink"
                      >
                        {doc.title}
                      </a>
                      {doc.pageCount
                        ? `, ${doc.pageCount} page${doc.pageCount > 1 ? "s" : ""}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <AskVitaButton
                      question={`Quelles sont les principales garanties de ${doc.table.organisme} selon le document « ${doc.title} » ?`}
                      className="rounded-full bg-vita px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
                    >
                      Demander à Vita
                    </AskVitaButton>
                    {doc.deletable && (
                      <DocumentActions id={doc.id} title={doc.title} />
                    )}
                  </div>
                </div>

                {/* Un tableau par produit : formules et tarifs en colonnes, garanties par catégorie */}
                {products.map((produit) => {
                  const { formules, rows } = buildComparison(
                    doc.table,
                    produit,
                  );
                  const groups = groupByCategory(rows);
                  if (rows.length === 0) return null;
                  return (
                    <div key={produit} className="mt-8">
                      {products.length > 1 && (
                        <h3 className="mb-3 text-lg font-bold">{produit}</h3>
                      )}
                      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
                        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                          <thead>
                            <tr className="bg-paper align-bottom">
                              <th
                                scope="col"
                                className="w-2/5 px-5 py-4 font-medium text-muted"
                              >
                                Garantie
                              </th>
                              {formules.map((f) => (
                                <th
                                  key={f.nom}
                                  scope="col"
                                  className="px-5 py-4"
                                >
                                  <span className="block font-[family-name:var(--font-bricolage)] text-lg font-bold">
                                    {f.nom}
                                  </span>
                                  <span className="text-xs font-normal text-muted">
                                    {f.prix
                                      ? `${f.prix} / mois`
                                      : "Tarif non indiqué"}
                                  </span>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          {groups.map((group) => (
                            <tbody key={group.categorie}>
                              <tr className="border-t border-line bg-teal-soft/40">
                                <th
                                  colSpan={formules.length + 1}
                                  scope="colgroup"
                                  className="px-5 py-2 text-xs font-semibold text-teal"
                                >
                                  {group.label}
                                </th>
                              </tr>
                              {group.rows.map((r) => (
                                <tr
                                  key={r.soin}
                                  className="border-t border-line align-top"
                                >
                                  <th
                                    scope="row"
                                    className="px-5 py-3.5 font-normal"
                                  >
                                    <AskVitaButton
                                      question={`Comment est remboursé le poste « ${r.soin} » dans le produit ${produit} de ${doc.table.organisme} ?`}
                                      className="text-left font-semibold underline decoration-vita/30 underline-offset-4 hover:decoration-vita"
                                    >
                                      {r.soin}
                                    </AskVitaButton>
                                    {r.detail && (
                                      <span className="block text-xs text-muted">
                                        {r.detail}
                                      </span>
                                    )}
                                  </th>
                                  {r.valeurs.map((v, i) => (
                                    <td
                                      key={i}
                                      className={`px-5 py-3.5 tabular-nums ${v === "Non couvert" || v === "–" ? "text-muted" : ""}`}
                                    >
                                      {v}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          ))}
                        </table>
                      </div>
                    </div>
                  );
                })}
              </section>
            );
          })
        )}
      </main>
      <SiteFooter />
    </>
  );
}
