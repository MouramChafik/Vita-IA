// Page /garanties : l'offre de base de Vita Mutuelle, puis les produits publiés depuis la page Extraction.
// Chaque organisme est présenté avec ses produits ; chaque produit a son tableau formules x garanties.
// Les documents publiés viennent de Supabase via getPublishedDocuments() (en cache, vidé à chaque publication).

import type { Metadata } from "next";
import Link from "next/link";
import DocumentActions from "@/components/DocumentActions";
import ProductTable, { type ProductTableData } from "@/components/ProductTable";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import AskVitaButton from "@/components/vita/AskVitaButton";
import { getPublishedDocuments } from "@/lib/catalog";
import { buildComparison, groupByCategory, listProducts } from "@/lib/guarantee-table";
import type { GuaranteeTable } from "@/lib/schemas";
import { VITA_SOURCE, VITA_TABLE } from "@/lib/vita-catalog";

export const metadata: Metadata = { title: "Garanties et tarifs · Vita Mutuelle" };

type Offer = {
  key: string;
  table: GuaranteeTable;
  source: { title: string; url: string; pageCount: number | null };
  base: boolean; // offre de base, toujours présente
  publishedAt?: string;
  documentId?: string; // documents publiés : actions Réextraire / Supprimer
};

const slug = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// Prépare les données (sérialisables) des tableaux de chaque produit
function productsOf(offer: Offer): (ProductTableData & { anchor: string })[] {
  return listProducts(offer.table)
    .map((produit) => {
      const { formules, rows } = buildComparison(offer.table, produit);
      return {
        anchor: `${offer.key}-${slug(produit)}`,
        organisme: offer.table.organisme,
        produit,
        formules,
        groups: groupByCategory(rows).map((g) => ({ label: g.label, rows: g.rows })),
      };
    })
    .filter((p) => p.groups.length > 0 && p.formules.length > 0);
}

export default async function GarantiesPage() {
  const published = await getPublishedDocuments();

  const offers: Offer[] = [
    { key: "vita", table: VITA_TABLE, source: VITA_SOURCE, base: true },
    ...published.map((d) => ({
      key: `doc-${d.id.slice(0, 8)}`,
      table: d.table,
      source: { title: d.title, url: `/api/documents/${d.id}`, pageCount: d.pageCount },
      base: false,
      publishedAt: d.createdAt,
      documentId: d.deletable ? d.id : undefined,
    })),
  ];
  const withProducts = offers.map((offer) => ({ offer, products: productsOf(offer) }));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        {/* En-tête et sommaire */}
        <header className="grid gap-10 pt-12 lg:grid-cols-[1fr_20rem] lg:items-start">
          <div>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Garanties et tarifs</h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
              Comparez les formules soin par soin. Cliquez sur une garantie pour que Vita vous explique le calcul, avec la page
              du document en source.
            </p>
          </div>
          <nav aria-label="Sommaire des produits" className="rounded-2xl border border-line bg-white p-5">
            <p className="text-sm font-semibold">Sur cette page</p>
            <ul className="mt-3 space-y-3 text-sm">
              {withProducts.map(({ offer, products }) => (
                <li key={offer.key}>
                  <span className="text-muted">{offer.table.organisme}</span>
                  <ul className="mt-1 space-y-1">
                    {products.map((p) => (
                      <li key={p.anchor}>
                        <a href={`#${p.anchor}`} className="font-medium hover:text-teal">
                          {p.produit}
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        {withProducts.map(({ offer, products }) => (
          <section key={offer.key} aria-labelledby={`${offer.key}-title`} className="mt-16 border-t-2 border-ink pt-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm">
                  {offer.base ? (
                    <span className="rounded-full bg-teal-soft px-2.5 py-1 font-medium text-teal">Offre de base</span>
                  ) : (
                    <span className="rounded-full bg-vita-soft px-2.5 py-1 font-medium text-vita">
                      Ajouté depuis l&apos;extraction
                      {offer.publishedAt &&
                        ` le ${new Date(offer.publishedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`}
                    </span>
                  )}
                </p>
                <h2 id={`${offer.key}-title`} className="mt-3 text-3xl font-bold">
                  {offer.table.organisme}
                  {offer.table.annee ? <span className="font-medium text-muted"> {offer.table.annee}</span> : null}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Source :{" "}
                  <a href={offer.source.url} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-ink">
                    {offer.source.title}
                  </a>
                  {offer.source.pageCount ? `, ${offer.source.pageCount} page${offer.source.pageCount > 1 ? "s" : ""}` : ""}
                  {products.length > 1 && ` · ${products.length} produits`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <AskVitaButton
                  question={`Quelles sont les principales garanties de ${offer.table.organisme} ?`}
                  className="rounded-full bg-vita px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
                >
                  Demander à Vita
                </AskVitaButton>
                {offer.documentId && <DocumentActions id={offer.documentId} title={offer.source.title} />}
              </div>
            </div>

            {products.map((p) => (
              <article key={p.anchor} id={p.anchor} className="mt-10 scroll-mt-24">
                <h3 className="text-xl font-bold">{p.produit}</h3>
                <div className="mt-4">
                  <ProductTable data={p} />
                </div>
              </article>
            ))}
          </section>
        ))}

        {/* Invitation à ajouter une offre */}
        <aside className="mt-20 flex flex-wrap items-center justify-between gap-6 rounded-3xl bg-ink px-6 py-8 text-white sm:px-10">
          <div>
            <h2 className="text-2xl font-bold">Ajouter une autre offre</h2>
            <p className="mt-2 max-w-lg text-white/70">
              Déposez le tableau de garanties d&apos;une mutuelle : ses produits et tarifs s&apos;ajoutent ici, et Vita peut en
              parler.
            </p>
          </div>
          <Link href="/extraction" className="rounded-full bg-white px-5 py-2.5 font-semibold text-ink hover:bg-teal-soft">
            Extraire un PDF
          </Link>
        </aside>
      </main>
      <SiteFooter />
    </>
  );
}
