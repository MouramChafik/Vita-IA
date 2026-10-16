import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import VitaWidget from "@/components/vita/VitaWidget";
import "./globals.css";

// Deux familles bien distinctes : une grotesque expressive pour les titres, une sans sobre pour le texte
const display = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });
const body = Figtree({ variable: "--font-figtree", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vita Mutuelle · votre santé, des réponses claires",
  description:
    "Mutuelle fictive de démonstration avec Vita, un assistant IA qui répond à vos questions sur vos garanties en citant les documents.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable} antialiased`}>
      <body className="min-h-screen bg-paper text-ink">
        {children}
        {/* Le widget Vita est présent sur toutes les pages */}
        <VitaWidget />
      </body>
    </html>
  );
}
