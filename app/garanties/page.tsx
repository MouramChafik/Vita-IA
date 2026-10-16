// Page /garanties : les produits sous forme de cartes, regroupés par organisme.
// D'abord l'offre de base Vita Mutuelle, puis les documents publiés depuis la page Extraction.
// Un clic sur une carte ouvre la page détail du produit (/garanties/[offre]/[produit]).

import type { Metadata } from "next";
import Link from "next/link";
import OfferHeader from "@/components/OfferHeader";
import ProductCard from "@/components/ProductCard";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { getOffers } from "@/lib/offers";

export const metadata: Metadata = {
  title: "Garanties et tarifs",
  description: "Comparez les formules santé et prévoyance : tarifs mensuels et remboursements, soin par soin (consultations, optique, dentaire, hospitalisation).",
  alternates: { canonical: "/garanties" },
};

export default async function GarantiesPage() {
  const offers = await getOffers();
  const productCount = offers.reduce((n, o) => n + o.products.length, 0);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3 pb-2 pt-10">
          <div>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Garanties et tarifs</h1>
            <p className="mt-2 text-muted">
              {productCount} produit{productCount > 1 ? "s" : ""} chez {offers.length} organisme{offers.length > 1 ? "s" : ""}
            </p>
          </div>
          <p className="max-w-md text-muted">
            Choisissez un produit pour voir ses formules, ses tarifs et le détail des remboursements, soin par soin.
          </p>
        </header>

        {offers.map((offer) => (
          <section key={offer.key} aria-label={offer.table.organisme} className="mt-12 border-t-2 border-ink pt-8">
            <OfferHeader offer={offer} />
            <div className={`mt-8 grid gap-5 ${offer.products.length > 1 ? "sm:grid-cols-2 lg:grid-cols-3" : ""}`}>
              {offer.products.map((p) => (
                <ProductCard
                  key={p.slug}
                  offerKey={offer.key}
                  organisme={offer.table.organisme}
                  product={p}
                  wide={offer.products.length === 1}
                />
              ))}
            </div>
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
