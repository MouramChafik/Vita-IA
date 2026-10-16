// Carte d'un produit sur /garanties : illustration, nom, tarif de départ, soins couverts.
// Toute la carte est cliquable et mène à la page détail du produit.

import Link from "next/link";
import { CATEGORY_LABELS } from "@/lib/guarantee-table";
import { formatPrice, productHref, type Product } from "@/lib/offers";
import ProductIllustration, { themeFor } from "./ProductIllustration";

// wide : carte horizontale, quand l'organisme n'a qu'un produit (évite une carte seule dans une grille vide)
export default function ProductCard({
  offerKey,
  organisme,
  product,
  wide = false,
}: {
  offerKey: string;
  organisme: string;
  product: Product;
  wide?: boolean;
}) {
  const shown = product.categories.slice(0, wide ? 6 : 3);
  const more = product.categories.length - shown.length;

  return (
    <Link
      href={productHref(offerKey, product.slug)}
      className={`group flex flex-col overflow-hidden rounded-3xl ${wide ? "md:flex-row" : ""} border border-line bg-white transition hover:border-ink/25 hover:shadow-[0_24px_50px_-30px_rgba(15,42,46,0.45)]`}
    >
      <ProductIllustration
        theme={themeFor(product.name, product.categories)}
        className={`aspect-[16/9] w-full ${wide ? "md:aspect-auto md:w-[45%] md:shrink-0" : ""}`}
      />
      <div className={`flex flex-1 flex-col p-5 ${wide ? "md:p-8" : ""}`}>
        <p className="text-xs font-medium text-muted">{organisme}</p>
        <h3 className="mt-1 text-xl font-bold leading-snug">{product.name}</h3>

        <p className="mt-3 text-sm">
          {product.minPrice !== null ? (
            <>
              dès <span className="font-[family-name:var(--font-bricolage)] text-2xl font-bold">{formatPrice(product.minPrice)}</span>
              <span className="text-muted"> / mois</span>
            </>
          ) : (
            <span className="text-muted">Tarif sur devis</span>
          )}
        </p>

        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Soins couverts">
          {shown.map((c) => (
            <li key={c} className="rounded-full bg-paper px-2.5 py-1 text-xs text-ink/80">
              {CATEGORY_LABELS[c]}
            </li>
          ))}
          {more > 0 && <li className="rounded-full bg-paper px-2.5 py-1 text-xs text-muted">+{more}</li>}
        </ul>

        <div className="mt-auto flex items-center justify-between border-t border-line pt-4 text-sm">
          <span className="text-muted">
            {product.formules.length} formule{product.formules.length > 1 ? "s" : ""} · {product.guaranteeCount} garanties
          </span>
          <span className="flex items-center gap-1 font-semibold text-teal">
            Voir le détail
            <svg viewBox="0 0 16 16" className="h-4 w-4 transition group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
