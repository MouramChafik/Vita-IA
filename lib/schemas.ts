// Schémas de l'extraction des garanties.
// Deux versions du même schéma :
// - GuaranteeTableSchema (Zod) : valide la réponse et donne le type TypeScript ;
// - GEMINI_GUARANTEE_SCHEMA (format OpenAPI) : envoyé à Gemini dans responseSchema.

import { z } from "zod";

export const CATEGORIES = ["soins_courants", "hospitalisation", "optique", "dentaire", "medecine_douce", "autre"] as const;
export const UNITES = ["% BR", "euros", "euros par an", "euros par jour", "frais réels", "non couvert", "autre"] as const;

export const GuaranteeSchema = z.object({
  produit: z.string().min(1).default("Offre"), // gamme ou fiche produit (un PDF peut en contenir plusieurs)
  categorie: z.enum(CATEGORIES),
  soin: z.string().min(1), // ex. "Consultation spécialiste secteur 2 non OPTAM"
  formule: z.string().min(1), // ex. "Équilibre"
  valeur: z.number().nullable(), // ex. 150 ; null si non couvert
  unite: z.enum(UNITES),
  conditions: z.string().nullable(), // plafonds, délais, limites
  page: z.number().int().positive().nullable(), // page du document où figure l'information
});

export const FormulaSchema = z.object({
  produit: z.string().min(1).default("Offre"), // ex. "Orvalis Santé Senior"
  nom: z.string().min(1), // ex. "Équilibre"
  cotisation_mensuelle: z.number().nullable(), // en euros, si le document l'indique
});

export const GuaranteeTableSchema = z.object({
  organisme: z.string(),
  annee: z.number().int().nullable(),
  formules: z.array(FormulaSchema), // dans l'ordre du document
  garanties: z.array(GuaranteeSchema),
});

export type Guarantee = z.infer<typeof GuaranteeSchema>;
export type Formula = z.infer<typeof FormulaSchema>;
export type GuaranteeTable = z.infer<typeof GuaranteeTableSchema>;

// Même structure, au format attendu par l'API Gemini
export const GEMINI_GUARANTEE_SCHEMA = {
  type: "OBJECT",
  properties: {
    organisme: { type: "STRING" },
    annee: { type: "INTEGER", nullable: true },
    formules: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          produit: { type: "STRING" },
          nom: { type: "STRING" },
          cotisation_mensuelle: { type: "NUMBER", nullable: true },
        },
        required: ["produit", "nom", "cotisation_mensuelle"],
      },
    },
    garanties: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          produit: { type: "STRING" },
          categorie: { type: "STRING", enum: [...CATEGORIES] },
          soin: { type: "STRING" },
          formule: { type: "STRING" },
          valeur: { type: "NUMBER", nullable: true },
          unite: { type: "STRING", enum: [...UNITES] },
          conditions: { type: "STRING", nullable: true },
          page: { type: "INTEGER", nullable: true },
        },
        required: ["produit", "categorie", "soin", "formule", "valeur", "unite", "conditions", "page"],
        propertyOrdering: ["produit", "categorie", "soin", "formule", "valeur", "unite", "conditions", "page"],
      },
    },
  },
  required: ["organisme", "annee", "formules", "garanties"],
  propertyOrdering: ["organisme", "annee", "formules", "garanties"],
};
