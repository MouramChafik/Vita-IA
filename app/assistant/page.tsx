// Page plein écran pour discuter avec Vita.
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
