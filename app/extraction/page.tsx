// Page de démonstration de l'extraction structurée : PDF -> JSON des garanties.
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import ExtractionTool from "@/components/ExtractionTool";

export const metadata: Metadata = {
  title: "Extraction des garanties",
  description: "Transformez le tableau de garanties d'une mutuelle (PDF) en données structurées : formules, tarifs et remboursements, soin par soin.",
  alternates: { canonical: "/extraction" },
};

export default function ExtractionPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-6">
        <h1 className="text-3xl font-bold sm:text-4xl">Extraction des garanties</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Le PDF est lu par Gemini, qui renvoie chaque garantie dans un format fixe (soin, formule, montant, unité,
          page). Le résultat est vérifié avant affichage : un champ manquant ou une valeur inattendue est rejeté.
        </p>
        <ExtractionTool />
      </main>
    </>
  );
}
