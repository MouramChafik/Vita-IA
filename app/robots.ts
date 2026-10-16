// robots.txt : tout est indexable, sauf l'API.
// Les pages réservées ne sont pas listées ici (ce fichier est public) : elles portent une balise noindex.
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
