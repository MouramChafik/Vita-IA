// Page « Le projet » : pourquoi Vita, ce qu'elle fait, comment, et ce qu'elle deviendrait sur un vrai site.
// Page statique (composant serveur) : tout le contenu est écrit ici.

import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import AskVitaButton from "@/components/vita/AskVitaButton";

export const metadata: Metadata = {
  title: "Le projet",
  description:
    "Pourquoi Vita, ce qu'elle fait et comment : un assistant IA qui répond à partir des documents du contrat et montre la page source de chaque réponse.",
  alternates: { canonical: "/projet" },
};

// Étapes du RAG : c'est une vraie séquence, d'où la numérotation
const RAG_STEPS = [
  { title: "Découper", text: "Chaque PDF est coupé en passages d'environ un paragraphe, sans couper de phrase, en gardant leur page." },
  { title: "Vectoriser", text: "Chaque passage devient un vecteur de 768 nombres qui représente son sens (embedding Gemini)." },
  { title: "Chercher", text: "La question devient aussi un vecteur. Supabase (pgvector) retrouve les 5 passages au sens le plus proche." },
  { title: "Répondre", text: "Gemini rédige la réponse avec ces seuls passages et cite leur numéro. Chaque citation pointe vers la page du PDF." },
];

const CTA_CLASS =
  "mt-5 inline-block rounded-full border border-white/30 px-4 py-2 text-sm font-semibold hover:border-white hover:bg-white hover:text-ink";

const FEATURES: { name: string; href: string | null; ask?: string; cta: string; what: string; why: string[] }[] = [
  {
    name: "Répondre avec les sources",
    href: null, // ouvre le widget Vita
    cta: "Poser une question",
    what: "Une question en langage courant, une réponse en langage simple. Chaque chiffre porte un numéro de source : un clic déplie l'extrait, un autre ouvre le PDF à la bonne page.",
    why: [
      "Dans l'assurance, une réponse doit être vérifiable : la page source transforme « faites-moi confiance » en « vérifiez vous-même ».",
      "Si aucun passage n'est assez proche de la question, Vita répond qu'elle ne sait pas, sans même appeler le modèle. Mieux vaut un refus qu'un chiffre inventé.",
      "La réponse s'affiche pendant qu'elle s'écrit (streaming) : l'attente paraît plus courte et l'utilisateur voit que le travail avance.",
    ],
  },
  {
    name: "Comparer les offres",
    href: "/garanties",
    cta: "Voir les garanties",
    what: "Chaque produit a sa carte et sa page : formules, tarifs mensuels, remboursements regroupés par type de soin. Sur mobile, on choisit une formule et on lit la liste soin par soin.",
    why: [
      "Un tableau de garanties est fait pour comparer : on garde des colonnes par formule sur grand écran, mais pas de défilement horizontal sur téléphone.",
      "Chaque ligne est cliquable pour demander à Vita d'expliquer le calcul : la page et l'assistante se complètent.",
      "Les pages sont précalculées et mises en cache par Next.js, puis rafraîchies à chaque nouvelle publication.",
    ],
  },
  {
    name: "Transformer un PDF en données",
    href: "/extraction",
    cta: "Essayer l'extraction",
    what: "On dépose le tableau de garanties d'une mutuelle. Produits, formules, tarifs et remboursements sont extraits, vérifiés, puis publiés sur la page Garanties et appris par Vita.",
    why: [
      "Gemini reçoit un format de réponse imposé (JSON Schema), puis Zod revérifie tout : un montant écrit en texte ou un champ manquant est rejeté.",
      "Les longs documents sont traités par lots de 3 pages, puis fusionnés : d'un seul bloc, le modèle s'arrêtait aux premières pages (6 garanties au lieu de 149).",
      "Une donnée peut être valide sans être juste (« non couvert » à la place de « frais réels ») : d'où l'intérêt de relire et d'évaluer les extractions.",
    ],
  },
  {
    name: "Orienter selon sa situation",
    href: null,
    ask: "Quelle formule me conseillez-vous pour ma famille ?",
    cta: "Décrire ma situation",
    what: "« Je suis marié, deux enfants, mon épouse est infirmière libérale. » Vita pose les questions manquantes avec des réponses en un clic, puis propose des pistes santé et prévoyance, chacune justifiée.",
    why: [
      "Le modèle lit la situation et la transforme en profil structuré ; des règles transparentes choisissent les pistes ; le modèle les explique. Le classement est reproductible et testé.",
      "Recommander un contrat relève du conseil, encadré par la réglementation : Vita présente des options et le dit clairement, la décision reste humaine.",
      "Les questions ne portent jamais sur la santé : seulement le foyer, l'activité, les besoins et le budget.",
    ],
  },
];

const SAFEGUARDS = [
  { title: "Réponses fondées", text: "Le modèle ne reçoit que les extraits retrouvés et doit les citer. Sans extrait pertinent, il n'est pas appelé." },
  { title: "Décision par des règles", text: "Pour l'orientation, des règles écrites et testées choisissent ; l'IA explique. On peut justifier chaque proposition." },
  { title: "Évaluation automatique", text: "30 questions de référence mesurent la bonne source, la bonne réponse et l'absence d'invention, et signalent toute baisse de score." },
  { title: "Secrets protégés", text: "Les clés d'API ne quittent jamais le serveur ; la base n'est accessible qu'aux fonctions serveur." },
];

const REAL_WORLD = [
  {
    domain: "Assurance",
    intro: "Sur le site d'un vrai assureur, Vita deviendrait l'assistante de l'espace adhérent.",
    items: [
      "Connexion de l'adhérent : Vita répond à partir de SON contrat, de SES garanties et de SES remboursements en cours.",
      "Suivi des remboursements et des demandes (« où en est ma facture d'optique ? ») via les API internes.",
      "Simulation de reste à charge à partir d'un devis déposé (optique, dentaire, hospitalisation).",
      "Passage de relais à un conseiller, avec le résumé de la conversation, dès que la demande relève du conseil ou d'une réclamation.",
      "Conformité : recueil des besoins tracé (devoir de conseil), données de santé chez un hébergeur certifié HDS, journaux anonymisés (RGPD).",
    ],
  },
  {
    domain: "Commerce en ligne",
    intro: "La même architecture sert un catalogue produits plutôt que des contrats.",
    items: [
      "Questions sur les fiches produits, les tailles, la compatibilité, en citant la fiche technique.",
      "Orientation : « un ordinateur pour du montage vidéo à moins de 1 200 € » → des règles filtrent le catalogue, l'IA explique les choix.",
      "Suivi de commande, retours et remboursements, en citant les conditions générales de vente.",
      "Extraction automatique des fiches fournisseurs (PDF) vers le catalogue, comme pour les tableaux de garanties.",
    ],
  },
  {
    domain: "Autres domaines",
    intro: "Partout où des documents font foi, le principe « réponse + source » s'applique.",
    items: [
      "Ressources humaines : convention collective, congés, mutuelle d'entreprise, avec la référence de l'article.",
      "Support technique : documentation et tickets passés, avec le lien vers la procédure.",
      "Juridique et administration : textes de Légifrance, démarches d'une collectivité, en citant le texte exact.",
      "Banque : conditions tarifaires et contrats, avec les mêmes exigences de traçabilité que l'assurance.",
    ],
  },
];

const PRODUCTION = [
  "Authentification et droits : chaque utilisateur ne voit que ses propres documents.",
  "Offre payante de l'API d'IA (quotas, temps de réponse garantis) et choix du modèle selon le coût.",
  "Suivi des requêtes avec un outil dédié (par exemple Langfuse) et alertes sur les erreurs.",
  "Évaluation lancée à chaque modification dans l'intégration continue, avec un seuil qui bloque une régression.",
  "Journaux anonymisés et durée de conservation définie ; hébergement des données conforme au secteur.",
  "Indexation en tâche de fond pour les gros volumes de documents, et mise à jour quand un document change.",
];

export default function ProjetPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Introduction */}
        <header className="mx-auto max-w-6xl px-4 pb-14 pt-12 sm:px-6">
          <p className="text-sm font-medium text-teal">Le projet</p>
          <h1 className="mt-2 max-w-3xl text-4xl font-bold leading-[1.1] sm:text-6xl">
            Une IA qui prouve chacune de ses réponses.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            Vita rend les contrats santé compréhensibles : elle répond à partir des documents du contrat, montre la page
            source, et dit « je ne sais pas » quand l&apos;information n&apos;y est pas.
          </p>
        </header>

        {/* Pourquoi */}
        <section className="border-y border-line bg-white py-16">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-[1fr_1.4fr]">
            <h2 className="text-3xl font-bold">Pourquoi ce projet ?</h2>
            <div className="space-y-5 text-lg leading-relaxed">
              <p>
                Les contrats de mutuelle sont <strong>difficiles à comprendre</strong>. Les notices font des dizaines de pages,
                les tableaux de garanties parlent en « % BR » et en « frais réels », et la question la plus simple, « combien
                je serai remboursé ? », demande souvent d&apos;appeler un conseiller.
              </p>
              <p>
                Les assistants IA classiques répondent vite, mais ils <strong>inventent parfois des chiffres</strong>. Dans
                l&apos;assurance, une réponse fausse n&apos;est pas acceptable.
              </p>
              <p className="border-l-2 border-teal pl-5 text-muted">
                L&apos;idée de Vita : un assistant qui répond uniquement à partir des documents du contrat, qui montre la page
                source de chaque réponse, et qui dit « je ne sais pas » quand l&apos;information n&apos;y est pas.
              </p>
            </div>
          </div>
        </section>

        {/* Comment : le RAG */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-bold">Comment ça marche ?</h2>
          <p className="mt-3 max-w-2xl text-muted">
            La technique s&apos;appelle le RAG, génération augmentée par recherche : avant de répondre, on cherche les bons
            passages, et l&apos;IA ne répond qu&apos;avec eux.
          </p>
          <ol className="mt-10 grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-4">
            {RAG_STEPS.map((step, i) => (
              <li key={step.title} className="bg-paper p-6">
                <span className="font-[family-name:var(--font-bricolage)] text-4xl font-bold text-teal/30">{i + 1}</span>
                <h3 className="mt-2 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-xl font-bold">Les briques</h3>
              <dl className="mt-4 divide-y divide-line border-y border-line">
                {[
                  ["Next.js", "Le site et l'API dans un seul projet ; les clés restent côté serveur."],
                  ["Google Gemini", "Les embeddings (le sens des textes) et la rédaction des réponses."],
                  ["Supabase (pgvector)", "Stockage des documents et recherche par similarité."],
                  ["Zod", "Vérifie que chaque donnée produite par l'IA respecte le format attendu."],
                ].map(([name, text]) => (
                  <div key={name} className="grid grid-cols-[9rem_1fr] gap-4 py-3 text-sm">
                    <dt className="font-semibold">{name}</dt>
                    <dd className="text-muted">{text}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <h3 className="text-xl font-bold">Les garde-fous</h3>
              <ul className="mt-4 divide-y divide-line border-y border-line">
                {SAFEGUARDS.map((s) => (
                  <li key={s.title} className="py-3 text-sm">
                    <span className="font-semibold">{s.title}.</span> <span className="text-muted">{s.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Fonctionnalités */}
        <section className="bg-ink py-16 text-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-3xl font-bold">Ce que fait le site, et pourquoi comme ça</h2>
            <p className="mt-3 max-w-2xl text-white/65">
              Chaque fonctionnalité répond à un besoin précis. Pour chacune : ce qu&apos;elle fait, puis les choix qui
              l&apos;expliquent.
            </p>

            <div className="mt-12 divide-y divide-white/10 border-y border-white/10">
              {FEATURES.map((f) => (
                <article key={f.name} className="grid gap-6 py-10 md:grid-cols-[1fr_1.5fr]">
                  <div>
                    <h3 className="text-2xl font-bold">{f.name}</h3>
                    <p className="mt-3 leading-relaxed text-white/75">{f.what}</p>
                    {f.href ? (
                      <Link href={f.href} className={CTA_CLASS}>
                        {f.cta}
                      </Link>
                    ) : (
                      // Pas de page dédiée : le bouton ouvre le widget Vita
                      <AskVitaButton question={f.ask} className={CTA_CLASS}>
                        {f.cta}
                      </AskVitaButton>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-teal-soft">Pourquoi ce choix</p>
                    <ul className="mt-3 space-y-3">
                      {f.why.map((w) => (
                        <li key={w} className="flex gap-3 leading-relaxed text-white/85">
                          <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* En conditions réelles */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-bold">Et sur un vrai site ?</h2>
          <p className="mt-3 max-w-2xl text-muted">
            Vita est une démonstration, mais l&apos;architecture se transpose telle quelle. Voici ce qu&apos;une assistante
            comme elle pourrait faire en conditions réelles.
          </p>

          <div className="mt-10 grid gap-10 lg:grid-cols-3">
            {REAL_WORLD.map((d) => (
              <section key={d.domain} className="border-t-2 border-ink pt-5">
                <h3 className="text-xl font-bold">{d.domain}</h3>
                <p className="mt-2 text-sm text-muted">{d.intro}</p>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed">
                  {d.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="mt-14 rounded-3xl border border-line bg-white p-6 sm:p-10">
            <h3 className="text-xl font-bold">Pour passer en production</h3>
            <p className="mt-2 text-sm text-muted">Ce qu&apos;il faudrait ajouter à la démonstration pour un service réel.</p>
            <ul className="mt-5 grid gap-x-10 gap-y-3 text-sm leading-relaxed md:grid-cols-2">
              {PRODUCTION.map((p) => (
                <li key={p} className="flex gap-3">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-vita" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Conclusion */}
        <section className="border-t border-line bg-teal-soft/50 py-14">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-4 sm:px-6">
            <p className="max-w-2xl font-[family-name:var(--font-bricolage)] text-2xl font-bold leading-snug sm:text-3xl">
              Vita rend les contrats santé compréhensibles, avec une IA qui prouve chacune de ses réponses.
            </p>
            <AskVitaButton className="rounded-full bg-vita px-6 py-3 font-semibold text-white shadow-lg shadow-vita/25 hover:brightness-110">
              Essayer Vita
            </AskVitaButton>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
