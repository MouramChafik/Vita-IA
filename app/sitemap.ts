// sitemap.xml : liste des pages à indexer par les moteurs de recherche, produits compris
import type { MetadataRoute } from "next";
import { getOffers, productHref } from "@/lib/offers";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const offers = await getOffers();
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/garanties`, changeFrequency: "weekly", priority: 0.9 },
    // { url: `${SITE_URL}/assistant`, changeFrequency: "monthly", priority: 0.8 }, // page masquée pour le moment
    { url: `${SITE_URL}/extraction`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/projet`, changeFrequency: "monthly", priority: 0.6 },
  ];
  const products: MetadataRoute.Sitemap = offers.flatMap((o) =>
    o.products.map((p) => ({ url: `${SITE_URL}${productHref(o.key, p.slug)}`, changeFrequency: "monthly" as const, priority: 0.7 })),
  );
  return [...pages, ...products];
}
