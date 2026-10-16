import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import VitaWidget from "@/components/vita/VitaWidget";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

// Deux familles bien distinctes : une grotesque expressive pour les titres, une sans sobre pour le texte
const display = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });
const body = Figtree({ variable: "--font-figtree", subsets: ["latin"] });

// Référencement : valeurs par défaut, complétées ou remplacées par chaque page
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL), // rend absolues les URL des images de partage et liens canoniques
  title: {
    default: "Vita Mutuelle · votre santé, des réponses claires",
    template: "%s · Vita Mutuelle", // « Garanties et tarifs » -> « Garanties et tarifs · Vita Mutuelle »
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["mutuelle santé", "complémentaire santé", "garanties santé", "remboursement", "assistant IA", "RAG", "100 % Santé"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: SITE_NAME,
    title: "Vita Mutuelle · votre santé, des réponses claires",
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: "Vita Mutuelle", description: SITE_DESCRIPTION },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#0b6e5e" };

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
