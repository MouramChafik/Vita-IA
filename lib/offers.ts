// Offres affichées sur /garanties : l'offre de base Vita Mutuelle + les documents publiés.
// Partagé par la liste des produits (cartes) et la page détail d'un produit.

import { getPublishedDocuments } from "./catalog";
import { assignPhotos, themeFor, type Photo, type Theme } from "./photos";
import { buildComparison, groupByCategory, listProducts, type TableRow } from "./guarantee-table";
import type { Guarantee, GuaranteeTable } from "./schemas";
import { VITA_SOURCE, VITA_TABLE } from "./vita-catalog";

export type Product = {
  slug: string;
  name: string;
  shortName: string; // sans le nom de marque répété : « Santé Jeunes »
  formules: { nom: string; prix: string | null }[];
  minPrice: number | null; // cotisation la plus basse, pour « dès 21,90 € / mois »
  categories: Guarantee["categorie"][];
  guaranteeCount: number;
  groups: { label: string; rows: TableRow[] }[];
  theme: Theme;
  photo: Photo; // attribuée par getOffers() pour éviter les doublons sur la page
};

export type Offer = {
  key: string; // "vita" ou l'id du document publié
  table: GuaranteeTable;
  source: { title: string; url: string; pageCount: number | null };
  base: boolean;
  publishedAt?: string;
  documentId?: string; // présent si le document peut être réextrait ou supprimé
  products: Product[];
};

export const slugify = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// « Orvalis Santé Jeunes » chez « Mutuelle Orvalis » -> « Santé Jeunes »
export function shortName(produit: string, organisme: string): string {
  const brand = organisme.split(/\s+/).filter((w) => !/^mutuelle$/i.test(w));
  const words = produit.split(/\s+/);
  const rest = brand.length && words[0]?.toLowerCase() === brand[0].toLowerCase() ? words.slice(1) : words;
  return rest.join(" ") || produit;
}

export function productsOf(table: GuaranteeTable): Product[] {
  return listProducts(table)
    .map((name) => {
      const { formules, rows } = buildComparison(table, name);
      const prices = table.formules
        .filter((f) => f.produit.toLowerCase() === name.toLowerCase() && f.cotisation_mensuelle !== null)
        .map((f) => f.cotisation_mensuelle as number);
      const groups = groupByCategory(rows);
      const theme = themeFor(name, groups.map((g) => g.categorie), rows.map((r) => r.soin));
      return {
        slug: slugify(name),
        name,
        shortName: shortName(name, table.organisme),
        formules,
        minPrice: prices.length ? Math.min(...prices) : null,
        categories: groups.map((g) => g.categorie),
        guaranteeCount: rows.length,
        groups: groups.map((g) => ({ label: g.label, rows: g.rows })),
        theme,
        photo: PHOTO_PLACEHOLDER,
      };
    })
    .filter((p) => p.formules.length > 0 && p.guaranteeCount > 0);
}

// Remplacée par la vraie photo dans getOffers(), une fois tous les produits connus
const PHOTO_PLACEHOLDER: Photo = { src: "", alt: "", author: "", page: "" };

export async function getOffers(): Promise<Offer[]> {
  const published = await getPublishedDocuments();
  const offers: Offer[] = [
    { key: "vita", table: VITA_TABLE, source: VITA_SOURCE, base: true, products: productsOf(VITA_TABLE) },
    ...published.map((d) => ({
      key: d.id,
      table: d.table,
      source: { title: d.title, url: `/api/documents/${d.id}`, pageCount: d.pageCount },
      base: false,
      publishedAt: d.createdAt,
      documentId: d.deletable ? d.id : undefined,
      products: productsOf(d.table),
    })),
  ];

  // Une photo par produit, sans doublon sur la page (ordre d'affichage : Vita d'abord)
  const photos = assignPhotos(offers.flatMap((o) => o.products.map((p) => ({ key: `${o.key}/${p.slug}`, theme: p.theme }))));
  for (const o of offers) for (const p of o.products) p.photo = photos.get(`${o.key}/${p.slug}`) ?? p.photo;
  return offers;
}

export const productHref = (offerKey: string, productSlug: string) => `/garanties/${offerKey}/${productSlug}`;

export const formatPrice = (n: number) => `${n.toLocaleString("fr-FR", { minimumFractionDigits: n % 1 ? 2 : 0 })} €`;
