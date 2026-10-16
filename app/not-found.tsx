// Page 404 : affichée pour toute adresse inconnue (et par notFound()).
// Objectif : rassurer et proposer une suite, plutôt qu'une impasse.

import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import AskVitaButton from "@/components/vita/AskVitaButton";

export const metadata: Metadata = { title: "Page introuvable", robots: { index: false } };

const LINKS = [
  { href: "/garanties", title: "Garanties et tarifs", text: "Comparez les formules et leurs remboursements, soin par soin." },
  { href: "/#documents", title: "Documents", text: "Notice, tableau des garanties et guide du 100 % Santé." },
  { href: "/projet", title: "Le projet", text: "Comment Vita répond en citant ses sources." },
];

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-12 sm:px-6 sm:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-sm font-semibold text-teal">Erreur 404</p>
            <h1 className="mt-2 text-4xl font-bold leading-tight sm:text-5xl">Cette page est introuvable.</h1>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-muted">
              Le lien est peut-être ancien, ou l&apos;adresse contient une faute de frappe. Voici où retrouver
              l&apos;information.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/" className="rounded-full bg-teal px-6 py-3 font-semibold text-white hover:brightness-110">
                Retour à l&apos;accueil
              </Link>
              <AskVitaButton className="rounded-full border border-ink/15 px-6 py-3 font-semibold hover:border-ink/40">
                Demander à Vita
              </AskVitaButton>
            </div>
          </div>

          {/* Le pouls du logo, avec un battement manquant à la place de la page */}
          <svg viewBox="0 0 420 160" className="w-full max-w-lg text-teal" role="img" aria-label="Tracé de pouls interrompu">
            <path
              d="M0 90h70l14-30 20 64 22-96 14 62h40"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M190 90h44" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeDasharray="2 14" opacity=".45" />
            <text x="212" y="64" textAnchor="middle" className="fill-ink font-[family-name:var(--font-bricolage)] text-[34px] font-bold">
              404
            </text>
            <path
              d="M250 90h40l14-30 20 64 22-96 14 62h60"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <section aria-labelledby="pistes" className="mt-16 border-t border-line pt-8">
          <h2 id="pistes" className="text-sm font-semibold text-muted">
            Pages utiles
          </h2>
          <ul className="mt-4 grid gap-4 md:grid-cols-3">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="group block h-full rounded-2xl border border-line bg-white p-5 hover:border-teal">
                  <span className="flex items-center justify-between font-semibold">
                    {l.title}
                    <svg viewBox="0 0 16 16" className="h-4 w-4 text-teal transition group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="mt-1 block text-sm text-muted">{l.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
