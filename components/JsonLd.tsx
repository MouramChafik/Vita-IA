// Données structurées (schema.org) lues par Google pour enrichir les résultats de recherche.
// Le contenu vient de notre propre code, jamais de l'utilisateur ; "<" est échappé par précaution.
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
