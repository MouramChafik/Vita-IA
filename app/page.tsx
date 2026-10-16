// Page d'accueil de Vita Mutuelle (mutuelle fictive de démonstration).
// Composant serveur : pas de "use client" ici, seuls les boutons Vita sont interactifs.

import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AskVitaButton from "@/components/vita/AskVitaButton";

const FORMULES = ["Essentielle", "Équilibre", "Sérénité"] as const;

// Chiffres d'exemple. BR = base de remboursement de la Sécurité sociale.
const GARANTIES: { soin: string; detail: string; valeurs: [string, string, string] }[] = [
  { soin: "Consultation chez un spécialiste", detail: "Secteur 2, médecin non OPTAM", valeurs: ["100 % BR", "150 % BR", "200 % BR"] },
  { soin: "Lunettes (verres et monture)", detail: "Par an et par bénéficiaire", valeurs: ["100 €", "200 €", "350 €"] },
  { soin: "Couronne dentaire", detail: "Hors panier 100 % Santé", valeurs: ["125 % BR", "200 % BR", "300 % BR"] },
  { soin: "Chambre particulière", detail: "Hospitalisation, par jour", valeurs: ["Non couvert", "40 €", "70 €"] },
  { soin: "Médecine douce", detail: "Ostéopathe, diététicien, par an", valeurs: ["Non couvert", "120 €", "250 €"] },
];

const PRIX = ["29 €", "48 €", "74 €"];

const DOCUMENTS = [
  { titre: "Notice d'information 2026", pages: "4 pages", fichier: "/documents/vita-notice-2026.pdf", question: "Quels soins ne sont pas remboursés par Vita Mutuelle ?" },
  { titre: "Tableau des garanties 2026", pages: "1 page", fichier: "/documents/vita-tableau-garanties-2026.pdf", question: "Que rembourse la formule Équilibre pour l'hospitalisation ?" },
  { titre: "Guide du 100 % Santé", pages: "2 pages", fichier: "/documents/vita-guide-100-sante.pdf", question: "Qu'est-ce que le 100 % Santé pour les lunettes ?" },
];

const FAQ = [
  {
    q: "Comment Vita trouve-t-elle ses réponses ?",
    r: "Vita cherche les passages les plus proches de votre question dans les documents de la mutuelle, puis rédige une réponse à partir de ces passages uniquement. Chaque réponse indique le document et la page utilisés.",
  },
  {
    q: "Mes questions sont-elles enregistrées ?",
    r: "Les questions sont journalisées sans donnée personnelle, pour mesurer la qualité des réponses. Ne saisissez jamais votre numéro de sécurité sociale ni d'information médicale.",
  },
  {
    q: "Vita remplace-t-elle un conseiller ?",
    r: "Non. Vita explique vos garanties et la façon dont un soin est remboursé. Pour un devis ou une réclamation, un conseiller reste nécessaire.",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero : on montre tout de suite ce qui distingue le site, une réponse sourcée */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
          <div>
            <h1 className="text-[2.6rem] font-bold leading-[1.05] sm:text-6xl">
              Combien serez-vous remboursé ? Demandez, on vous montre la page.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Vita lit votre notice et votre tableau de garanties à votre place. Elle répond en langage simple et cite
              le passage exact du document.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <AskVitaButton className="rounded-full bg-vita px-6 py-3 font-semibold text-white shadow-lg shadow-vita/25 hover:brightness-110">
                Poser une question à Vita
              </AskVitaButton>
              <Link href="#garanties" className="rounded-full border border-ink/15 px-6 py-3 font-semibold hover:border-ink/40">
                Voir les garanties
              </Link>
            </div>
          </div>

          {/* Exemple de conversation (statique) */}
          <figure className="relative">
            <div className="rounded-[28px] border border-line bg-white p-5 shadow-[0_30px_70px_-35px_rgba(15,42,46,0.4)] sm:p-6">
              <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-sm text-white">
                Je vais chez un dermatologue en secteur 2, je suis en formule Équilibre. Combien je récupère ?
              </p>
              <div className="mt-4 rounded-2xl rounded-bl-md border border-line px-4 py-3 text-sm leading-relaxed">
                <p className="mb-1 text-xs font-semibold text-vita">Vita</p>
                <p>
                  Pour une consultation à 60 €, la base de remboursement est de 23 €. La Sécurité sociale vous
                  verse 14,10 € et Vita Mutuelle complète jusqu&apos;à 150 % de cette base, soit 18,40 €. Il vous
                  reste 27,50 € à payer.
                </p>
                <p className="mt-3 inline-flex items-center gap-2 rounded-md bg-teal-soft px-2.5 py-1 text-xs font-medium text-teal">
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
                    <path d="M4 1h6l4 4v10H4zM10 1v4h4" opacity=".9" />
                  </svg>
                  Tableau des garanties, page 2
                </p>
              </div>
            </div>
            <figcaption className="mt-3 text-center text-xs text-muted">Exemple de réponse, chiffres fictifs.</figcaption>
          </figure>
        </section>

        {/* Garanties : un vrai tableau, plus lisible que des cartes pour comparer */}
        <section id="garanties" className="scroll-mt-20 border-y border-line bg-white py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-3xl font-bold sm:text-4xl">Trois formules, comparées ligne par ligne</h2>
            <p className="mt-3 max-w-2xl text-muted">
              Un doute sur une ligne ? Cliquez sur le soin, Vita vous explique le calcul.
            </p>

            <div className="mt-10 overflow-x-auto rounded-2xl border border-line">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-paper">
                    <th scope="col" className="w-2/5 px-5 py-4 font-medium text-muted">Soin</th>
                    {FORMULES.map((f, i) => (
                      <th key={f} scope="col" className={`px-5 py-4 ${i === 1 ? "bg-teal text-white" : ""}`}>
                        <span className="block font-[family-name:var(--font-bricolage)] text-lg font-bold">{f}</span>
                        <span className={`text-xs font-normal ${i === 1 ? "text-white/75" : "text-muted"}`}>
                          dès {PRIX[i]} / mois
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {GARANTIES.map((g) => (
                    <tr key={g.soin} className="border-t border-line">
                      <th scope="row" className="px-5 py-4 font-normal">
                        <AskVitaButton
                          question={`Comment est remboursé le poste « ${g.soin} » dans chaque formule ?`}
                          className="text-left font-semibold underline decoration-vita/30 underline-offset-4 hover:decoration-vita"
                        >
                          {g.soin}
                        </AskVitaButton>
                        <span className="block text-xs text-muted">{g.detail}</span>
                      </th>
                      {g.valeurs.map((v, i) => (
                        <td
                          key={i}
                          className={`px-5 py-4 tabular-nums ${i === 1 ? "bg-teal-soft/60 font-semibold" : ""} ${
                            v === "Non couvert" ? "text-muted" : ""
                          }`}
                        >
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted">BR : base de remboursement de la Sécurité sociale. Montants d&apos;exemple.</p>
              <Link href="/garanties" className="text-sm font-semibold text-teal underline underline-offset-4 hover:no-underline">
                Voir toutes les garanties et les autres offres
              </Link>
            </div>
          </div>
        </section>

        {/* Fonctionnement : c'est une vraie séquence, d'où la numérotation */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-3xl font-bold sm:text-4xl">Ce qui se passe quand vous posez une question</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              ["Vita cherche", "Votre question est comparée à chaque passage des documents pour retrouver les plus pertinents."],
              ["Vita lit", "Seuls ces passages sont transmis au modèle d'IA. Il n'invente pas à partir de sa mémoire."],
              ["Vita cite", "La réponse indique le document et la page. Vous pouvez vérifier en un clic."],
            ].map(([titre, texte], i) => (
              <li key={titre} className="border-l-2 border-vita/30 pl-5">
                <span className="font-[family-name:var(--font-bricolage)] text-sm font-bold text-vita">Étape {i + 1}</span>
                <h3 className="mt-1 text-xl font-bold">{titre}</h3>
                <p className="mt-2 leading-relaxed text-muted">{texte}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Documents publics */}
        <section id="documents" className="scroll-mt-20 bg-ink py-20 text-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-3xl font-bold sm:text-4xl">Les documents que Vita connaît</h2>
            <p className="mt-3 max-w-2xl text-white/65">
              Vita ne répond qu&apos;à partir de ces documents. Si l&apos;information n&apos;y figure pas, elle vous le dit.
            </p>
            <Link href="/extraction" className="mt-5 inline-block text-sm font-semibold text-white underline underline-offset-4 hover:no-underline">
              Extraire les garanties d&apos;un PDF en données structurées
            </Link>
            <ul className="mt-10 divide-y divide-white/10 border-y border-white/10">
              {DOCUMENTS.map((d) => (
                <li key={d.titre} className="flex flex-wrap items-center justify-between gap-4 py-5">
                  <div>
                    <p className="text-lg font-semibold">{d.titre}</p>
                    <p className="text-sm text-white/55">
                      PDF, {d.pages} ·{" "}
                      <a href={d.fichier} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-white">
                        Ouvrir
                      </a>
                    </p>
                  </div>
                  <AskVitaButton
                    question={d.question}
                    className="rounded-full border border-white/25 px-4 py-2 text-sm font-semibold hover:border-white hover:bg-white hover:text-ink"
                  >
                    Interroger ce document
                  </AskVitaButton>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Questions fréquentes : <details> natif, accessible sans JavaScript */}
        <section id="questions" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6">
          <h2 className="text-3xl font-bold sm:text-4xl">Questions fréquentes</h2>
          <div className="mt-8 divide-y divide-line border-y border-line">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                  {item.q}
                  <span className="text-2xl text-muted transition group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="mt-3 leading-relaxed text-muted">{item.r}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
