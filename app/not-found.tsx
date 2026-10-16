// Page 404 : affichée pour toute adresse inconnue. Volontairement minimale.
import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import AskVitaButton from "@/components/vita/AskVitaButton";

export const metadata: Metadata = { title: "Page introuvable", robots: { index: false } };

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex min-h-[calc(100dvh-61px)] flex-col items-center justify-center px-4 pb-20 text-center">
        <p className="bg-gradient-to-b from-teal to-teal/20 bg-clip-text font-[family-name:var(--font-bricolage)] text-[9rem] font-bold leading-none text-transparent sm:text-[12rem]">
          404
        </p>
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Page introuvable</h1>
        <p className="mt-2 max-w-sm text-muted">Cette adresse n&apos;existe pas ou a changé.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-full bg-ink px-6 py-3 font-semibold text-white hover:bg-teal">
            Retour à l&apos;accueil
          </Link>
          <AskVitaButton className="rounded-full px-6 py-3 font-semibold text-ink ring-1 ring-ink/15 hover:ring-ink/40">
            Demander à Vita
          </AskVitaButton>
        </div>
      </main>
    </>
  );
}
