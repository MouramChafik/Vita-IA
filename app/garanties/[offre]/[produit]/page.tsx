// Page détail d'un produit : /garanties/[offre]/[produit]
// [offre] = "vita" (offre de base) ou l'id du document publié ; [produit] = nom du produit en slug.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import OfferHeader from "@/components/OfferHeader";
import ProductCard from "@/components/ProductCard";
import ProductImage from "@/components/ProductImage";
import ProductTable from "@/components/ProductTable";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import JsonLd from "@/components/JsonLd";
import AskVitaButton from "@/components/vita/AskVitaButton";
import { formatPrice, getOffers, productHref } from "@/lib/offers";
import { SITE_URL } from "@/lib/site";

type Props = PageProps<"/garanties/[offre]/[produit]">;

// Pages générées à l'avance pour les produits connus au moment du build ;
// un produit publié ensuite est rendu à la première visite.
export async function generateStaticParams() {
  const offers = await getOffers();
  return offers.flatMap((o) => o.products.map((p) => ({ offre: o.key, produit: p.slug })));
}

async function find(params: Props["params"]) {
  const { offre, produit } = await params;
  const offer = (await getOffers()).find((o) => o.key === offre);
  const product = offer?.products.find((p) => p.slug === produit);
  return offer && product ? { offer, product } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await find(params);
  if (!found) return { title: "Produit introuvable", robots: { index: false } };
  const { offer, product } = found;
  const price = product.minPrice !== null ? `dès ${formatPrice(product.minPrice)} par mois` : "tarif sur devis";
  const url = productHref(offer.key, product.slug);
  const description = `${product.name} (${offer.table.organisme}) : ${product.formules.length} formule${
    product.formules.length > 1 ? "s" : ""
  }, ${price}. ${product.guaranteeCount} garanties détaillées : ${product.groups.map((g) => g.label.toLowerCase()).join(", ")}.`;
  return {
    title: `${product.name} · ${offer.table.organisme}`,
    description,
    alternates: { canonical: url },
    openGraph: { title: product.name, description, url },
  };
}

export default function ProductPage(props: Props) {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<p className="mx-auto max-w-6xl px-4 pt-10 text-muted sm:px-6">Chargement du produit…</p>}>
        <ProductContent params={props.params} />
      </Suspense>
      <SiteFooter />
    </>
  );
}

async function ProductContent({ params }: { params: Props["params"] }) {
  const found = await find(params);
  if (!found) notFound();
  const { offer, product } = found;
  const others = offer.products.filter((p) => p.slug !== product.slug).slice(0, 3);
  const { theme, photo } = product; // même photo que sur la carte (attribuée par getOffers)

  // Données structurées : le produit, ses formules (prix mensuel) et le fil d'Ariane
  const url = `${SITE_URL}${productHref(offer.key, product.slug)}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": theme === "sante" || theme === "jeunes" || theme === "senior" ? "HealthInsurancePlan" : "FinancialProduct",
        name: product.name,
        url,
        provider: { "@type": "Organization", name: offer.table.organisme },
        offers: offer.table.formules
          .filter((f) => f.produit.toLowerCase() === product.name.toLowerCase() && f.cotisation_mensuelle !== null)
          .map((f) => ({ "@type": "Offer", name: f.nom, price: f.cotisation_mensuelle, priceCurrency: "EUR", description: "Cotisation mensuelle par adulte" })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Garanties", item: `${SITE_URL}/garanties` },
          { "@type": "ListItem", position: 2, name: product.name, item: url },
        ],
      },
    ],
  };

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <JsonLd data={structuredData} />
      <nav aria-label="Fil d'Ariane" className="pt-8 text-sm text-muted">
        <Link href="/garanties" className="hover:text-ink">
          Garanties
        </Link>
        <span className="mx-2">/</span>
        <span>{offer.table.organisme}</span>
        <span className="mx-2">/</span>
        <span className="text-ink">{product.shortName}</span>
      </nav>

      {/* Présentation du produit */}
      <header className="mt-6 grid items-center gap-8 md:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="text-sm font-medium text-muted">{offer.table.organisme}</p>
          <h1 className="mt-1 text-4xl font-bold leading-tight sm:text-5xl">{product.name}</h1>
          <p className="mt-4 text-lg">
            {product.minPrice !== null ? (
              <>
                dès <span className="font-[family-name:var(--font-bricolage)] text-3xl font-bold">{formatPrice(product.minPrice)}</span>
                <span className="text-muted"> / mois</span>
              </>
            ) : (
              <span className="text-muted">Tarif sur devis</span>
            )}
          </p>
          <p className="mt-2 text-muted">
            {product.formules.length} formule{product.formules.length > 1 ? "s" : ""}, {product.guaranteeCount} garanties sur{" "}
            {product.groups.map((g) => g.label.toLowerCase()).join(", ")}.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <AskVitaButton
              question={`Présente-moi le produit ${product.name} de ${offer.table.organisme} : à qui il s'adresse et ce qu'il rembourse.`}
              className="rounded-full bg-vita px-5 py-2.5 font-semibold text-white shadow-lg shadow-vita/25 hover:brightness-110"
            >
              Demander à Vita
            </AskVitaButton>
            <a href={offer.source.url} target="_blank" rel="noreferrer" className="rounded-full border border-ink/15 px-5 py-2.5 font-semibold hover:border-ink/40">
              Voir le document source
            </a>
          </div>
        </div>
        <figure>
          <ProductImage photo={photo} priority sizes="(min-width: 768px) 45vw, 100vw" className="aspect-[16/10] w-full rounded-3xl" />
          <figcaption className="mt-2 text-right text-xs text-muted">
            Photo :{" "}
            <a href={photo.page} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-ink">
              {photo.author}, Unsplash
            </a>
          </figcaption>
        </figure>
      </header>

      {/* Formules et tarifs */}
      {product.formules.length > 1 && (
        <section className="mt-14">
          <h2 className="text-2xl font-bold">Les formules</h2>
          <ul className="mt-5 grid gap-4" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(160px, 1fr))` }}>
            {product.formules.map((f, i) => (
              <li key={f.nom} className={`rounded-2xl border p-5 ${i === 1 ? "border-teal bg-teal-soft/40" : "border-line bg-white"}`}>
                <p className="font-[family-name:var(--font-bricolage)] text-lg font-bold">{f.nom}</p>
                <p className="mt-2 text-sm text-muted">
                  {f.prix ? (
                    <>
                      <span className="font-[family-name:var(--font-bricolage)] text-2xl font-bold text-ink">{f.prix}</span> / mois
                    </>
                  ) : (
                    "Tarif sur devis"
                  )}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Détail des garanties */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold">Détail des garanties</h2>
        <p className="mt-1 text-sm text-muted">Cliquez sur une garantie pour que Vita vous explique le remboursement.</p>
        <div className="mt-4">
          <ProductTable data={{ organisme: offer.table.organisme, produit: product.name, formules: product.formules, groups: product.groups }} />
        </div>
        <p className="mt-3 text-xs text-muted">BR : base de remboursement de la Sécurité sociale. Les remboursements incluent la part de la Sécurité sociale.</p>
      </section>

      {/* Organisme et autres produits */}
      <section className="mt-16 border-t-2 border-ink pt-8">
        <OfferHeader offer={offer} />
        {others.length > 0 && (
          <>
            <h2 className="mt-10 text-xl font-bold">Autres produits {offer.table.organisme}</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((p) => (
                <ProductCard key={p.slug} offerKey={offer.key} organisme={offer.table.organisme} product={p} />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
