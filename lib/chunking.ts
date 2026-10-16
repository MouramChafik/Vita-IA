// Découpage du texte d'un PDF en passages ("chunks").
//
// Pourquoi découper ? Un embedding résume le SENS d'un texte en un vecteur.
// Sur un document entier, le sens est trop dilué : on ne retrouverait pas
// « le passage sur l'optique ». On découpe donc en morceaux d'environ un paragraphe.
//
// Règles choisies :
// - on ne coupe jamais au milieu d'une phrase ;
// - un passage reste sur UNE page, pour pouvoir citer la page exacte ;
// - un léger chevauchement (overlap) entre passages voisins évite de perdre
//   une information coupée pile à la frontière.

export type Chunk = {
  index: number; // position du passage dans le document
  page: number; // numéro de page (commence à 1)
  content: string;
};

export type ChunkOptions = {
  maxChars?: number; // taille cible d'un passage
  overlapChars?: number; // texte repris du passage précédent
};

// Nettoie le texte extrait du PDF : césures en fin de ligne, espaces multiples...
export function normalizeText(text: string): string {
  return text
    .replace(/(\w)-\n(\w)/g, "$1$2") // "rembour-\nsement" -> "remboursement"
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Découpe en phrases. On coupe après . ! ? suivis d'un espace, ou sur un saut de ligne.
// (Volontairement simple : ça suffit pour des notices d'assurance.)
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function chunkPages(pages: string[], options: ChunkOptions = {}): Chunk[] {
  const maxChars = options.maxChars ?? 1000;
  const overlapChars = options.overlapChars ?? 150;
  const chunks: Chunk[] = [];

  pages.forEach((pageText, i) => {
    const page = i + 1;
    const sentences = splitSentences(normalizeText(pageText));
    let current: string[] = [];

    const flush = () => {
      if (current.length === 0) return;
      chunks.push({ index: chunks.length, page, content: current.join(" ") });

      // Chevauchement : on garde les dernières phrases tant qu'on reste sous overlapChars
      const kept: string[] = [];
      let size = 0;
      for (let j = current.length - 1; j >= 0; j--) {
        size += current[j].length + 1;
        if (size > overlapChars) break;
        kept.unshift(current[j]);
      }
      current = kept;
    };

    for (const sentence of sentences) {
      const currentLength = current.join(" ").length;
      if (currentLength > 0 && currentLength + 1 + sentence.length > maxChars) {
        flush();
      }
      current.push(sentence);
    }

    // Fin de page : on enregistre le reste, sauf s'il ne contient que le chevauchement déjà enregistré
    const last = chunks[chunks.length - 1];
    const rest = current.join(" ");
    if (rest && !(last && last.page === page && last.content.endsWith(rest))) {
      chunks.push({ index: chunks.length, page, content: rest });
    }
  });

  return chunks;
}
