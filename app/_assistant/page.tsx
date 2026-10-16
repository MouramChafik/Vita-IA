// Page plein écran pour discuter avec Vita.
// MASQUÉE POUR LE MOMENT : le dossier s'appelle « _assistant » ; Next.js ignore les dossiers
// qui commencent par « _ », donc /assistant affiche la page 404. Vita reste disponible via le widget.
// Pour la réafficher : renommer le dossier en « assistant », puis décommenter le lien du menu
// (components/SiteHeader.tsx) et l'entrée du sitemap (app/sitemap.ts).
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import VitaChat from "@/components/vita/VitaChat";

export const metadata: Metadata = {
  title: "Assistant Vita",
  description: "Posez vos questions sur vos remboursements santé : Vita répond en langage simple et cite la page exacte du document.",
  alternates: { canonical: "/assistant" },
};

export default function AssistantPage() {
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
