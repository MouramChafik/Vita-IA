// robots.txt : tout est indexable, sauf l'API et la page d'administration
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/supervision"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
