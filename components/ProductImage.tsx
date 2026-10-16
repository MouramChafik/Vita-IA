// Photos des produits : images libres de droits (licence Unsplash, usage commercial autorisé).
// Le thème est déduit du nom du produit (jeunes, senior, revenus...) ou, à défaut, de ses garanties.

import Image from "next/image";

export type Theme = "sante" | "jeunes" | "senior" | "revenus" | "deces" | "autonomie" | "optique" | "dentaire";

export function themeFor(name: string, categories: string[] = []): Theme {
  const n = name.toLowerCase();
  if (/jeune|étudiant|etudiant/.test(n)) return "jeunes";
  if (/senior|retrait/.test(n)) return "senior";
  if (/revenu|indemn|arrêt|arret|incapacit|indépendant|independant/.test(n)) return "revenus";
  if (/décès|deces|obsèque|obseque/.test(n)) return "deces";
  if (/autonomie|dépendance|dependance/.test(n)) return "autonomie";
  if (/optique|lunette/.test(n)) return "optique";
  if (/dentaire/.test(n)) return "dentaire";
  if (categories.length === 1 && categories[0] === "optique") return "optique";
  if (categories.length === 1 && categories[0] === "dentaire") return "dentaire";
  return "sante";
}

// Une photo par thème, avec son auteur et sa page Unsplash (crédit)
export const PHOTOS: Record<Theme, { src: string; alt: string; author: string; page: string }> = {
  sante: {
    src: "https://images.unsplash.com/photo-1576091160550-2173dba999ef",
    alt: "Médecin à son bureau avec un stéthoscope et un ordinateur portable",
    author: "National Cancer Institute",
    page: "https://unsplash.com/photos/NFvdKIhxYlU",
  },
  jeunes: {
    src: "https://images.unsplash.com/photo-1549057446-9f5c6ac91a04",
    alt: "Groupe de jeunes amis qui marchent en riant",
    author: "Eliott Reyna",
    page: "https://unsplash.com/photos/jCEpN62oWL4",
  },
  senior: {
    src: "https://images.unsplash.com/photo-1625690987114-86f5af994b49",
    alt: "Couple âgé qui marche bras dessus bras dessous",
    author: "Hector Reyes",
    page: "https://unsplash.com/photos/GrSfB6-OPoY",
  },
  revenus: {
    src: "https://images.unsplash.com/photo-1683115099191-51e617fc5ff1",
    alt: "Outils d'artisan accrochés au mur d'un atelier",
    author: "Ryno Marais",
    page: "https://unsplash.com/photos/7j7g8XmtjSo",
  },
  deces: {
    src: "https://images.unsplash.com/photo-1529180979161-06b8b6d6f2be",
    alt: "Famille qui se tient la main au bord de la mer au coucher du soleil",
    author: "Mike Scheid",
    page: "https://unsplash.com/photos/0iqkntLw93A",
  },
  autonomie: {
    src: "https://images.unsplash.com/photo-1762955911431-4c44c7c3f408",
    alt: "Aide-soignante qui accompagne un couple de personnes âgées",
    author: "Age Cymru",
    page: "https://unsplash.com/photos/bSXk1lOp8T0",
  },
  optique: {
    src: "https://images.unsplash.com/photo-1517948430535-1e2469d314fe",
    alt: "Main qui tient une paire de lunettes",
    author: "David Travis",
    page: "https://unsplash.com/photos/aVvZJC0ynBQ",
  },
  dentaire: {
    src: "https://images.unsplash.com/photo-1681939282781-341ac4f61996",
    alt: "Patiente chez le dentiste pendant un contrôle",
    author: "SoyBreno",
    page: "https://unsplash.com/photos/z8BIWPwV3zo",
  },
};

// sizes : largeur affichée selon l'écran, pour que next/image serve la bonne taille
export default function ProductImage({
  theme,
  className = "",
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  priority = false,
}: {
  theme: Theme;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const photo = PHOTOS[theme];
  return (
    <div className={`relative overflow-hidden bg-teal-soft ${className}`}>
      <Image src={`${photo.src}?auto=format&fit=crop&w=1600&q=75`} alt={photo.alt} fill sizes={sizes} priority={priority} className="object-cover" />
    </div>
  );
}
