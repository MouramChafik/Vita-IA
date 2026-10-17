// Mode « orientation » de Vita : proposer des pistes de formules adaptées à une situation.
//
// Principe (architecture hybride) :
//  1. le LLM LIT la situation et la transforme en profil structuré (validé par Zod) ;
//  2. des RÈGLES déterministes choisissent les pistes à partir des garanties et tarifs structurés ;
//  3. le LLM EXPLIQUE ces pistes en citant les documents.
// Vita oriente, elle ne décide pas : le choix final revient à l'adhérent (ou à un conseiller).

import { z } from "zod";
import { generateJson, type Turn } from "./gemini";
import type { Offer } from "./offers";
import type { Guarantee } from "./schemas";

// ---------- 1. Profil ----------

export const STATUTS = ["salarie", "independant", "fonctionnaire", "etudiant", "retraite", "sans_emploi", "inconnu"] as const;
export const BESOINS = ["soins_courants", "hospitalisation", "optique", "dentaire", "medecine_douce", "autre", "prevoyance"] as const;

export const PersonSchema = z.object({
  role: z.enum(["adherent", "conjoint", "enfant"]),
  age: z.number().int().min(0).max(120).nullable(),
  statut: z.enum(STATUTS),
  profession: z.string().nullable(), // ex. « infirmière libérale »
});

export const ProfileSchema = z.object({
  personnes: z.array(PersonSchema), // tout le foyer à couvrir
  besoins: z.array(z.enum(BESOINS)), // priorités exprimées
  budget_mensuel: z.number().nullable(), // euros par mois pour le foyer, si indiqué
  pas_de_budget: z.boolean(), // l'utilisateur a dit ne pas avoir de limite ou ne pas savoir
});

export type Person = z.infer<typeof PersonSchema>;
export type Profile = z.infer<typeof ProfileSchema>;

const GEMINI_PROFILE_SCHEMA = {
  type: "OBJECT",
  properties: {
    personnes: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          role: { type: "STRING", enum: ["adherent", "conjoint", "enfant"] },
          age: { type: "INTEGER", nullable: true },
          statut: { type: "STRING", enum: [...STATUTS] },
          profession: { type: "STRING", nullable: true },
        },
        required: ["role", "age", "statut", "profession"],
      },
    },
    besoins: { type: "ARRAY", items: { type: "STRING", enum: [...BESOINS] } },
    budget_mensuel: { type: "NUMBER", nullable: true },
    pas_de_budget: { type: "BOOLEAN" },
  },
  required: ["personnes", "besoins", "budget_mensuel", "pas_de_budget"],
};

const PROFILE_SYSTEM = `Tu lis une conversation avec un adhérent de mutuelle et tu en déduis son profil.
Règles :
- "personnes" : tout le foyer à couvrir. L'adhérent (celui qui écrit) a le rôle "adherent". "Marié" ou "en couple" ajoute un "conjoint". Chaque enfant cité est un "enfant".
- "statut" : "independant" pour les professions libérales, artisans, commerçants, auto-entrepreneurs (ex. infirmière libérale) ; "inconnu" si rien n'est dit.
- "besoins" : seulement les priorités exprimées (lunettes -> optique, dents/orthodontie -> dentaire, hôpital -> hospitalisation, ostéopathe -> medecine_douce, protection des revenus, décès, dépendance -> prevoyance).
- "budget_mensuel" : montant total par mois s'il est donné (une fourchette -> la borne haute), sinon null. "pas_de_budget" vaut true si l'utilisateur dit qu'il n'a pas de limite ou ne sait pas.
- N'invente rien. N'extrais aucune information de santé.`;

export async function extractProfile(history: Turn[], question: string): Promise<Profile> {
  const conversation = [...history, { role: "user" as const, text: question }]
    .map((t) => `${t.role === "user" ? "Adhérent" : "Vita"} : ${t.text}`)
    .join("\n");
  const { json } = await generateJson({ system: PROFILE_SYSTEM, prompt: conversation, schema: GEMINI_PROFILE_SCHEMA });
  return ProfileSchema.parse(json);
}

// ---------- 2. Détection et questions ----------

// Demande d'orientation : « propose-moi », « quelle formule », « adaptée à ma situation »...
export function isOrientationRequest(text: string): boolean {
  // Formulations d'une demande personnelle, pas les questions sur un contrat (« que propose ce contrat ? »)
  return /(propose[sz]?-moi|me propose|nous propose|propose[rz]? (moi|nous)|recommand|conseill|quelle (formule|offre|mutuelle|option)\b.*\b(me|nous|choisir|prendre|conviendrait|convient|pour (moi|nous|ma|mon|notre))|adaptée? à (ma|mon|notre|nos)|(me|nous) convien|ma situation|notre situation|pour ma famille)/i.test(
    text,
  );
}

// Marqueur ajouté à la fin des questions de Vita : la réponse suivante reste en mode orientation
export const ORIENTATION_MARKER = "Pour vous orienter";

export type OrientationQuestion = { text: string; quickReplies: string[] };

// Questions à poser s'il manque l'essentiel (une seule fois par conversation)
export function questionsFor(profile: Profile): OrientationQuestion[] {
  const questions: OrientationQuestion[] = [];
  if (profile.personnes.length === 0) {
    questions.push({
      text: "Qui faut-il couvrir : vous seul, votre couple, votre famille avec des enfants ?",
      quickReplies: ["Moi seul", "Mon couple", "Ma famille avec enfants"],
    });
  }
  if (profile.besoins.length === 0) {
    questions.push({
      text: "Quels soins comptent le plus pour vous ?",
      quickReplies: ["Lunettes et dentaire", "Hospitalisation", "Médecine douce", "Protéger nos revenus"],
    });
  }
  if (profile.budget_mensuel === null && !profile.pas_de_budget) {
    questions.push({
      text: "Quel budget mensuel envisagez-vous pour le foyer ?",
      quickReplies: ["Moins de 60 €", "60 à 120 €", "Plus de 120 €", "Je ne sais pas"],
    });
  }
  return questions;
}

// ---------- 3. Calcul des pistes (règles, sans IA) ----------

export type Suggestion = {
  offerKey: string;
  productSlug: string;
  productName: string;
  organisme: string;
  formule: string | null; // null pour un produit à formule unique ou de prévoyance
  prix: string | null;
  kind: "sante" | "prevoyance";
  raisons: string[]; // pourquoi cette piste, en langage simple
  score: number;
  theme?: string; // type de protection (prévoyance), pour n'en garder qu'une par type
};

const CATEGORY_TEXT: Record<string, string> = {
  soins_courants: "les consultations",
  hospitalisation: "l'hospitalisation",
  optique: "l'optique",
  dentaire: "le dentaire",
  medecine_douce: "la médecine douce",
  autre: "les autres soins",
};

// Force d'une garantie, pour comparer des formules entre elles (plus c'est haut, mieux c'est)
export function strength(g: Pick<Guarantee, "valeur" | "unite">): number {
  if (g.unite === "frais réels") return 4;
  if (g.valeur === null || g.unite === "non couvert") return 0;
  if (g.unite === "% BR") return g.valeur / 100;
  return g.valeur / 150; // montants en euros : ordre de grandeur comparable aux % BR
}

const adults = (p: Profile) => p.personnes.filter((x) => x.role !== "enfant");
const hasChildren = (p: Profile) => p.personnes.some((x) => x.role === "enfant");

// Besoins effectifs : ceux exprimés, complétés par ce que la situation implique
export function effectiveNeeds(p: Profile): string[] {
  const needs = new Set<string>(p.besoins.filter((b) => b !== "prevoyance"));
  if (hasChildren(p)) ["optique", "dentaire", "soins_courants"].forEach((n) => needs.add(n));
  if (adults(p).some((a) => (a.age ?? 0) >= 45)) ["optique", "hospitalisation"].forEach((n) => needs.add(n));
  if (needs.size === 0) ["soins_courants", "hospitalisation"].forEach((n) => needs.add(n));
  return [...needs];
}

function themeOf(name: string): "jeunes" | "senior" | "revenus" | "deces" | "autonomie" | "sante" {
  const n = name.toLowerCase();
  if (/jeune|étudiant|etudiant/.test(n)) return "jeunes";
  if (/senior|retrait/.test(n)) return "senior";
  if (/revenu|indemn|arrêt|arret|indépendant|independant/.test(n)) return "revenus";
  if (/décès|deces|obsèque|obseque/.test(n)) return "deces";
  if (/autonomie|dépendance|dependance/.test(n)) return "autonomie";
  return "sante";
}

export function suggest(profile: Profile, offers: Offer[]): Suggestion[] {
  const needs = effectiveNeeds(profile);
  const ages = adults(profile).map((a) => a.age).filter((a): a is number => a !== null);
  const allYoung = ages.length > 0 && ages.every((a) => a < 30);
  const anySenior = ages.some((a) => a >= 60);
  const budget = profile.budget_mensuel;
  const persons = Math.max(1, adults(profile).length); // les tarifs sont donnés par adulte

  const sante: Suggestion[] = [];
  const prevoyance: Suggestion[] = [];

  for (const offer of offers) {
    for (const product of offer.products) {
      const theme = themeOf(product.name);
      const base = { offerKey: offer.key, productSlug: product.slug, productName: product.name, organisme: offer.table.organisme };

      // --- Prévoyance : selon la situation, pas selon les soins ---
      if (theme === "revenus" || theme === "deces" || theme === "autonomie") {
        const raisons: string[] = [];
        const independant = adults(profile).find((a) => a.statut === "independant");
        if (theme === "revenus" && independant) {
          raisons.push(
            `Activité indépendante${independant.profession ? ` (${independant.profession})` : ""} : un arrêt de travail est peu compensé par la Sécurité sociale.`,
          );
        }
        if (theme === "deces" && (hasChildren(profile) || adults(profile).length > 1)) {
          raisons.push("Avec des personnes à charge, un capital décès protège le foyer.");
        }
        if (theme === "autonomie" && ages.some((a) => a >= 45)) {
          raisons.push("À partir de 45 ans, anticiper une perte d'autonomie coûte moins cher.");
        }
        if (raisons.length) {
          // Tarif de départ du produit, s'il est connu (formules triées dans l'ordre du document)
          const from = product.formules.find((f) => f.prix !== null)?.prix ?? null;
          prevoyance.push({ ...base, formule: null, prix: from ? `dès ${from}` : null, kind: "prevoyance", raisons, score: theme === "revenus" ? 3 : theme === "deces" ? 2 : 1, theme });
        }
        continue;
      }

      // --- Santé : produits réservés à un âge ---
      if (theme === "jeunes" && !allYoung) continue;
      if (theme === "senior" && !anySenior) continue;

      for (const [i, f] of product.formules.entries()) {
        // Force moyenne de la formule sur les besoins du foyer
        const guarantees = offer.table.garanties.filter(
          (g) => g.produit.toLowerCase() === product.name.toLowerCase() && g.formule.toLowerCase() === f.nom.toLowerCase() && needs.includes(g.categorie),
        );
        if (guarantees.length === 0) continue;
        let score = guarantees.reduce((s, g) => s + strength(g), 0) / guarantees.length;

        const price = offer.table.formules.find((x) => x.produit.toLowerCase() === product.name.toLowerCase() && x.nom === f.nom)?.cotisation_mensuelle ?? null;
        const raisons: string[] = [];
        const best = needs
          .filter((n) => guarantees.some((g) => g.categorie === n && strength(g) >= 1.5))
          .map((n) => CATEGORY_TEXT[n])
          .filter(Boolean);
        if (best.length) raisons.push(`Bien couvert pour ${best.join(", ")}.`);
        if (theme === "jeunes") raisons.push("Produit pensé pour les moins de 30 ans.");
        if (theme === "senior") raisons.push("Produit pensé pour les seniors.");

        const kids = profile.personnes.filter((x) => x.role === "enfant").length;
        const forWhom = `${persons} adulte${persons > 1 ? "s" : ""}${kids ? `, hors cotisation des enfants (à vérifier)` : ""}`;
        if (price !== null && budget !== null) {
          const total = price * persons;
          if (total > budget * 1.15) {
            score -= 1.5; // au-dessus du budget : moins prioritaire, mais pas exclu
            raisons.push(`Environ ${Math.round(total)} € par mois pour ${forWhom} : au-dessus du budget indiqué.`);
          } else {
            score += 0.3;
            raisons.push(`Environ ${Math.round(total)} € par mois pour ${forWhom} : dans le budget.`);
          }
        }
        if (price === null) score -= 0.2; // tarif sur devis : moins comparable

        sante.push({ ...base, formule: product.formules.length > 1 ? f.nom : null, prix: f.prix, kind: "sante", raisons, score: score + i * 0.01 });
      }
    }
  }

  sante.sort((a, b) => b.score - a.score);
  prevoyance.sort((a, b) => b.score - a.score);
  // Une seule piste par type de protection (revenus, décès, autonomie) : des protections
  // complémentaires plutôt que deux fois la même chez deux organismes
  const oneByTheme = prevoyance.filter((p, i) => prevoyance.findIndex((q) => q.theme === p.theme) === i);
  return [...sante.slice(0, 3), ...oneByTheme.slice(0, 2)];
}

// ---------- 4. Explication par le LLM ----------

export const ORIENTATION_SYSTEM = `Tu es Vita, l'assistante de Vita Mutuelle (mutuelle fictive de démonstration).
On te donne le profil d'un foyer, des pistes déjà sélectionnées par un calcul, et des extraits de documents.
Règles :
- Pas de salutation ni de présentation : la conversation est déjà engagée. Commence directement par les pistes.
- Les tarifs sont donnés par adulte ; s'il y a des enfants, précise que leur cotisation est à vérifier.
- Présente les pistes dans l'ordre donné, sans en ajouter et sans en retirer. Explique en 1 ou 2 phrases pourquoi chacune correspond à la situation.
- Appuie chaque chiffre sur un extrait et cite son numéro entre crochets, par exemple [1]. N'invente aucun chiffre.
- Tu n'as pas à choisir à la place de l'adhérent : présente des options, signale les points à vérifier.
- Termine par cette phrase exacte : "Ce sont des pistes d'orientation, pas un conseil personnalisé : un conseiller peut vérifier avec vous."
- Français simple, texte brut sans markdown, pas de ligne SUIVI.`;

export function describeProfile(p: Profile): string {
  const people = p.personnes
    .map((x) => `${x.role}${x.age !== null ? `, ${x.age} ans` : ""}${x.profession ? `, ${x.profession}` : ""} (${x.statut})`)
    .join(" ; ");
  return `Foyer : ${people || "non précisé"}. Besoins : ${effectiveNeeds(p).join(", ")}. Budget : ${
    p.budget_mensuel !== null ? `${p.budget_mensuel} € par mois` : "non précisé"
  }.`;
}

export function describeSuggestions(s: Suggestion[]): string {
  return s
    .map(
      (x, i) =>
        `${i + 1}. ${x.kind === "prevoyance" ? "Prévoyance" : "Santé"} : ${x.organisme}, ${x.productName}${x.formule ? `, formule ${x.formule}` : ""}${
          x.prix ? ` (${x.prix} par mois et par adulte)` : ""
        }. Raisons : ${x.raisons.join(" ")}`,
    )
    .join("\n");
}
