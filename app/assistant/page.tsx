// Page plein écran pour discuter avec Vita.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import VitaChat from "@/components/vita/VitaChat";

// Page masquée pour le moment : elle répond 404. Vita reste disponible partout via le widget.
// Pour la réafficher : passer à true, puis remettre le lien du menu (SiteHeader) et l'entrée du sitemap.
const ASSISTANT_PAGE_ENABLED = false;

export const metadata: Metadata = {
  title: "Assistant Vita",
  robots: { index: false },
  description: "Posez vos questions sur vos remboursements santé : Vita répond en langage simple et cite la page exacte du document.",
  alternates: { canonical: "/assistant" },
};

export default function AssistantPage() {
  if (!ASSISTANT_PAGE_ENABLED) notFound();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex h-[calc(100dvh-65px)] max-w-3xl flex-col px-4 pb-6 pt-8 sm:px-6">
        <h1 className="text-3xl font-bold">Assistant Vita</h1>
        <p className="mt-2 text-muted">Vos garanties expliquées simplement, avec la source de chaque réponse.</p>
        <div className="min-h-0 flex-1">
          <VitaChat />
        </div>
      </main>
    </>
  );
}
