// Informations générales du site, utilisées pour le référencement (SEO).
// URL : SITE_URL si définie, sinon URL (fournie automatiquement par Netlify), sinon le local.
export const SITE_URL = (process.env.SITE_URL ?? process.env.URL ?? "http://localhost:3001").replace(/\/$/, "");

export const SITE_NAME = "Vita Mutuelle";

export const SITE_DESCRIPTION =
  "Comparez les garanties et tarifs santé et posez vos questions à Vita, l'assistante IA qui répond en citant la page exacte de vos documents. Mutuelle fictive de démonstration.";
