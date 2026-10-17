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

type Photo = { src: string; alt: string; author: string; page: string };

// Deux photos par thème (variante 0 : offre de base Vita ; variante 1 : offres ajoutées),
// pour éviter la même image deux fois sur la page. Avec l'auteur et la page Unsplash (crédit).
export const PHOTOS: Record<Theme, [Photo, Photo]> = {
  sante: [
    {
      src: "https://images.unsplash.com/photo-1576091160550-2173dba999ef",
      alt: "Médecin à son bureau avec un stéthoscope et un ordinateur portable",
      author: "National Cancer Institute",
      page: "https://unsplash.com/photos/NFvdKIhxYlU",
    },
    {
      src: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7",
      alt: "Médecin tenant un stéthoscope",
      author: "Online Marketing",
      page: "https://unsplash.com/photos/hIgeoQjS_iE",
    },
  ],
  jeunes: [
    {
      src: "https://images.unsplash.com/photo-1549057446-9f5c6ac91a04",
      alt: "Groupe de jeunes amis qui marchent en riant",
      author: "Eliott Reyna",
      page: "https://unsplash.com/photos/jCEpN62oWL4",
    },
    {
      src: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70",
      alt: "Trois jeunes les bras levés face au coucher du soleil",
      author: "Simon Maage",
      page: "https://unsplash.com/photos/tXiMrX3Gc-g",
    },
  ],
  senior: [
    {
      src: "https://images.unsplash.com/photo-1625690987114-86f5af994b49",
      alt: "Couple âgé qui marche bras dessus bras dessous",
      author: "Hector Reyes",
      page: "https://unsplash.com/photos/GrSfB6-OPoY",
    },
    {
      src: "https://images.unsplash.com/photo-1542622475-904e18612fa1",
      alt: "Couple de seniors assis face à la mer",
      author: "Sven Mieke",
      page: "https://unsplash.com/photos/zlA7c39DfFk",
    },
  ],
  revenus: [
    {
      src: "https://images.unsplash.com/photo-1683115099191-51e617fc5ff1",
      alt: "Outils d'artisan accrochés au mur d'un atelier",
      author: "Ryno Marais",
      page: "https://unsplash.com/photos/7j7g8XmtjSo",
    },
    {
      src: "https://images.unsplash.com/photo-1728379824591-8baf4afae695",
      alt: "Marteau planté dans une pièce de bois, atelier d'artisan",
      author: "Bob van Aubel",
      page: "https://unsplash.com/photos/xEcYf8S1MTg",
    },
  ],
  deces: [
    {
      src: "https://images.unsplash.com/photo-1529180979161-06b8b6d6f2be",
      alt: "Famille qui se tient la main au bord de la mer au coucher du soleil",
      author: "Mike Scheid",
      page: "https://unsplash.com/photos/0iqkntLw93A",
    },
    {
      src: "https://images.unsplash.com/photo-1496275068113-fff8c90750d1",
      alt: "Silhouettes d'une famille marchant au bord de la mer",
      author: "Kevin Delvecchio",
      page: "https://unsplash.com/photos/7noZJ_4nhU8",
    },
  ],
  autonomie: [
    {
      src: "https://images.unsplash.com/photo-1762955911431-4c44c7c3f408",
      alt: "Aide-soignante qui accompagne un couple de personnes âgées",
      author: "Age Cymru",
      page: "https://unsplash.com/photos/bSXk1lOp8T0",
    },
    {
      src: "https://images.unsplash.com/photo-1508963493744-76fce69379c0",
      alt: "Couple âgé assis sur un banc face à la mer",
      author: "Matt Bennett",
      page: "https://unsplash.com/photos/78hTqvjYMS4",
    },
  ],
  optique: [
    {
      src: "https://images.unsplash.com/photo-1517948430535-1e2469d314fe",
      alt: "Main qui tient une paire de lunettes",
      author: "David Travis",
      page: "https://unsplash.com/photos/aVvZJC0ynBQ",
    },
    {
      src: "https://images.unsplash.com/photo-1615468822882-4828d2602857",
      alt: "Lunettes de vue à monture argentée",
      author: "Harpreet Singh",
      page: "https://unsplash.com/photos/XbPhaw-x0i0",
    },
  ],
  dentaire: [
    {
      src: "https://images.unsplash.com/photo-1681939282781-341ac4f61996",
      alt: "Patiente chez le dentiste pendant un contrôle",
      author: "SoyBreno",
      page: "https://unsplash.com/photos/z8BIWPwV3zo",
    },
    {
      src: "https://images.unsplash.com/photo-1777331903190-341a3dd0441b",
      alt: "Dentiste parlant à un patient dans un cabinet moderne",
      author: "Harold Hisona",
      page: "https://unsplash.com/photos/Bg81yWKZlMg",
    },
  ],
};

// sizes : largeur affichée selon l'écran, pour que next/image serve la bonne taille
export const photoFor = (theme: Theme, variant = 0): Photo => PHOTOS[theme][variant % 2];

export default function ProductImage({
  theme,
  variant = 0,
  className = "",
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  priority = false,
}: {
  theme: Theme;
  variant?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const photo = photoFor(theme, variant);
  return (
    <div className={`relative overflow-hidden bg-teal-soft ${className}`}>
      <Image src={`${photo.src}?auto=format&fit=crop&w=1600&q=75`} alt={photo.alt} fill sizes={sizes} priority={priority} className="object-cover" />
    </div>
  );
}
