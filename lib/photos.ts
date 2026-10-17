// Photos des produits : images libres de droits (licence Unsplash gratuite, usage commercial
// autorisé, licence vérifiée photo par photo). 5 photos par thème, avec auteur et page (crédit).
// Module sans composant React : utilisable par les pages serveur et par les tests.

export type Theme = "sante" | "jeunes" | "senior" | "revenus" | "deces" | "autonomie" | "optique" | "dentaire";
export type Photo = { src: string; alt: string; author: string; page: string };

export const PHOTOS: Record<Theme, Photo[]> = {
  sante: [
    {"src": "https://images.unsplash.com/photo-1576091160550-2173dba999ef", "alt": "Médecin à son bureau avec un stéthoscope et un ordinateur portable", "author": "National Cancer Institute", "page": "https://unsplash.com/photos/NFvdKIhxYlU"},
    {"src": "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7", "alt": "Médecin tenant un stéthoscope", "author": "Online Marketing", "page": "https://unsplash.com/photos/hIgeoQjS_iE"},
    {"src": "https://images.unsplash.com/photo-1758273240360-76b908e7582a", "alt": "Deux femmes échangent dans un bureau moderne", "author": "Vitaly Gariev", "page": "https://unsplash.com/photos/QxkvMblcaJ0"},
    {"src": "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133", "alt": "Médecin souriant qui parle à un patient", "author": "National Cancer Institute", "page": "https://unsplash.com/photos/tl447mekwuQ"},
    {"src": "https://images.unsplash.com/photo-1758691461990-03b49d969495", "alt": "Médecin qui remplit le dossier d'un patient", "author": "Vitaly Gariev", "page": "https://unsplash.com/photos/8WYkI3cEZm8"}
  ],
  jeunes: [
    {"src": "https://images.unsplash.com/photo-1549057446-9f5c6ac91a04", "alt": "Groupe de jeunes amis qui marchent en riant", "author": "Eliott Reyna", "page": "https://unsplash.com/photos/jCEpN62oWL4"},
    {"src": "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70", "alt": "Trois jeunes les bras levés face au coucher du soleil", "author": "Simon Maage", "page": "https://unsplash.com/photos/tXiMrX3Gc-g"},
    {"src": "https://images.unsplash.com/photo-1606761568499-6d2451b23c66", "alt": "Étudiants qui travaillent devant un ordinateur", "author": "Dom Fou", "page": "https://unsplash.com/photos/YRMWVcdyhmI"},
    {"src": "https://images.unsplash.com/photo-1571260899304-425eee4c7efc", "alt": "Étudiante qui tient ses cahiers sur un campus", "author": "javier trueba", "page": "https://unsplash.com/photos/iQPr1XkF5F0"},
    {"src": "https://images.unsplash.com/photo-1758270705482-cee87ea98738", "alt": "Étudiants qui discutent en salle de cours", "author": "Vitaly Gariev", "page": "https://unsplash.com/photos/T9yehHSvLL4"}
  ],
  senior: [
    {"src": "https://images.unsplash.com/photo-1625690987114-86f5af994b49", "alt": "Couple âgé qui marche bras dessus bras dessous", "author": "Hector Reyes", "page": "https://unsplash.com/photos/GrSfB6-OPoY"},
    {"src": "https://images.unsplash.com/photo-1542622475-904e18612fa1", "alt": "Couple de seniors assis face à la mer", "author": "Sven Mieke", "page": "https://unsplash.com/photos/zlA7c39DfFk"},
    {"src": "https://images.unsplash.com/photo-1657664043009-c4975cb4eed3", "alt": "Grand-père et petit-enfant qui observent une plante", "author": "OPPO Find X5 Pro", "page": "https://unsplash.com/photos/Nc-hc5g5yhw"},
    {"src": "https://images.unsplash.com/photo-1593100126453-19b562a800c1", "alt": "Grand-mère qui serre un enfant dans ses bras", "author": "Ekaterina Shakharova", "page": "https://unsplash.com/photos/L4nwL3195U0"},
    {"src": "https://images.unsplash.com/photo-1761839257513-a921710a4291", "alt": "Deux femmes âgées admirent des fleurs dans un jardin", "author": "Land O'Lakes, Inc.", "page": "https://unsplash.com/photos/7BXmH9YzNAI"}
  ],
  revenus: [
    {"src": "https://images.unsplash.com/photo-1683115099191-51e617fc5ff1", "alt": "Outils d'artisan accrochés au mur d'un atelier", "author": "Ryno Marais", "page": "https://unsplash.com/photos/7j7g8XmtjSo"},
    {"src": "https://images.unsplash.com/photo-1728379824591-8baf4afae695", "alt": "Marteau planté dans une pièce de bois, atelier d'artisan", "author": "Bob van Aubel", "page": "https://unsplash.com/photos/xEcYf8S1MTg"},
    {"src": "https://images.unsplash.com/photo-1546514714-df0ccc50d7bf", "alt": "Indépendant au travail à son bureau", "author": "Per Lööv", "page": "https://unsplash.com/photos/4wOkqiXNP7M"},
    {"src": "https://images.unsplash.com/photo-1543269866-487350d6fa5e", "alt": "Femme qui travaille sur son ordinateur portable", "author": "Brooke Cagle", "page": "https://unsplash.com/photos/xcgh5_-QIXc"},
    {"src": "https://images.unsplash.com/photo-1615914143778-1a1a6e50c5dd", "alt": "Personne qui prend des notes à son bureau", "author": "Vadim Bozhko", "page": "https://unsplash.com/photos/lbO1iCnbTW0"}
  ],
  deces: [
    {"src": "https://images.unsplash.com/photo-1529180979161-06b8b6d6f2be", "alt": "Famille qui se tient la main au bord de la mer au coucher du soleil", "author": "Mike Scheid", "page": "https://unsplash.com/photos/0iqkntLw93A"},
    {"src": "https://images.unsplash.com/photo-1496275068113-fff8c90750d1", "alt": "Silhouettes d'une famille marchant au bord de la mer", "author": "Kevin Delvecchio", "page": "https://unsplash.com/photos/7noZJ_4nhU8"},
    {"src": "https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb", "alt": "Femme qui tient la main d'un homme et d'un enfant", "author": "Jessica Rockowitz", "page": "https://unsplash.com/photos/5NLCaz2wJXE"},
    {"src": "https://images.unsplash.com/photo-1761839258657-457dda39b5cc", "alt": "Famille réunie dans un jardin", "author": "Land O'Lakes, Inc.", "page": "https://unsplash.com/photos/p6wuN_3Wwqs"},
    {"src": "https://images.unsplash.com/photo-1648221350871-e3ae3c8d0f58", "alt": "Famille dans un champ au coucher du soleil", "author": "Tá Focando", "page": "https://unsplash.com/photos/LOuffSFpWQI"}
  ],
  autonomie: [
    {"src": "https://images.unsplash.com/photo-1762955911431-4c44c7c3f408", "alt": "Aide-soignante qui accompagne un couple de personnes âgées", "author": "Age Cymru", "page": "https://unsplash.com/photos/bSXk1lOp8T0"},
    {"src": "https://images.unsplash.com/photo-1508963493744-76fce69379c0", "alt": "Couple âgé assis sur un banc face à la mer", "author": "Matt Bennett", "page": "https://unsplash.com/photos/78hTqvjYMS4"},
    {"src": "https://images.unsplash.com/photo-1543333995-a78aea2eee50", "alt": "Femme qui accompagne une personne en fauteuil roulant", "author": "Dominik Lange", "page": "https://unsplash.com/photos/VUOiQW4OeLI"},
    {"src": "https://images.unsplash.com/photo-1762955911769-d652ceaa94bb", "alt": "Aide-soignante qui aide deux femmes âgées à tricoter", "author": "Age Cymru", "page": "https://unsplash.com/photos/GStFfDrOygo"},
    {"src": "https://images.unsplash.com/photo-1702648156180-25d8be9c9527", "alt": "Couple âgé assis sur un canapé", "author": "Centre for Ageing Better", "page": "https://unsplash.com/photos/rQJ3xo-0WYE"}
  ],
  optique: [
    {"src": "https://images.unsplash.com/photo-1517948430535-1e2469d314fe", "alt": "Main qui tient une paire de lunettes", "author": "David Travis", "page": "https://unsplash.com/photos/aVvZJC0ynBQ"},
    {"src": "https://images.unsplash.com/photo-1615468822882-4828d2602857", "alt": "Lunettes de vue à monture argentée", "author": "Harpreet Singh", "page": "https://unsplash.com/photos/XbPhaw-x0i0"},
    {"src": "https://images.unsplash.com/photo-1757386320806-e3f03c9f41e8", "alt": "Patient pendant un examen de la vue", "author": "Judy Beth Morris", "page": "https://unsplash.com/photos/Y0D5L-qKUcw"},
    {"src": "https://images.unsplash.com/photo-1775825094939-3759ede3dec2", "alt": "Personne qui regarde des lunettes en vitrine", "author": "atelierbyvineeth", "page": "https://unsplash.com/photos/Mk3Bp2G5I5M"},
    {"src": "https://images.unsplash.com/photo-1758656321505-95bf802f9a4c", "alt": "Optométriste qui examine les yeux d'un patient", "author": "Navy Medicine", "page": "https://unsplash.com/photos/OmCH8sh_UcM"}
  ],
  dentaire: [
    {"src": "https://images.unsplash.com/photo-1681939282781-341ac4f61996", "alt": "Patiente chez le dentiste pendant un contrôle", "author": "SoyBreno", "page": "https://unsplash.com/photos/z8BIWPwV3zo"},
    {"src": "https://images.unsplash.com/photo-1777331903190-341a3dd0441b", "alt": "Dentiste parlant à un patient dans un cabinet moderne", "author": "Harold Hisona", "page": "https://unsplash.com/photos/Bg81yWKZlMg"},
    {"src": "https://images.unsplash.com/photo-1629909613654-28e377c37b09", "alt": "Cabinet dentaire moderne", "author": "Benyamin Bohlouli", "page": "https://unsplash.com/photos/e7MJLM5VGjY"},
    {"src": "https://images.unsplash.com/photo-1606811971618-4486d14f3f99", "alt": "Examen dentaire avec miroir", "author": "Caroline LM", "page": "https://unsplash.com/photos/8BkF0sTC6Uo"},
    {"src": "https://images.unsplash.com/photo-1598256989800-fe5f95da9787", "alt": "Fauteuil dentaire dans un cabinet lumineux", "author": "Atikah Akhtar", "page": "https://unsplash.com/photos/XJptUS8nbhs"}
  ],
};

// Thème d'un produit : d'abord son nom, puis le nom de ses garanties, puis ses catégories.
// Un nom générique (« Pack Confort ») n'empêche donc pas de trouver la bonne image.
export function themeFor(name: string, categories: string[] = [], soins: string[] = []): Theme {
  const rules: [Theme, RegExp][] = [
    ["jeunes", /jeune|étudiant|etudiant/],
    ["senior", /senior|retrait/],
    ["revenus", /revenu|indemn|arrêt|arret|incapacit|indépendant|independant|invalidit/],
    ["deces", /décès|deces|obsèque|obseque|rente éducation/],
    ["autonomie", /autonomie|dépendance|dependance/],
    ["optique", /optique|lunette/],
    ["dentaire", /dentaire|prothèse dentaire/],
  ];
  const n = name.toLowerCase();
  for (const [theme, re] of rules) if (re.test(n)) return theme;

  // Nom générique : on regarde les garanties (ex. « indemnités journalières » -> revenus)
  const text = soins.join(" ").toLowerCase();
  for (const [theme, re] of rules.slice(2, 5)) if (re.test(text)) return theme;

  // Produit centré sur un seul type de soins
  if (categories.length === 1 && categories[0] === "optique") return "optique";
  if (categories.length === 1 && categories[0] === "dentaire") return "dentaire";
  return "sante";
}

// Attribue une photo à chaque produit de la page, dans l'ordre d'affichage :
// chaque produit prend la première photo de son thème pas encore utilisée.
// Tant qu'il reste des photos, aucune image n'apparaît deux fois sur la page.
export function assignPhotos(items: { key: string; theme: Theme }[]): Map<string, Photo> {
  const used: Partial<Record<Theme, number>> = {};
  const result = new Map<string, Photo>();
  for (const { key, theme } of items) {
    const n = used[theme] ?? 0;
    result.set(key, PHOTOS[theme][n % PHOTOS[theme].length]); // au-delà du stock, on recommence
    used[theme] = n + 1;
  }
  return result;
}
