// Schémas de l'extraction des garanties.
// Deux versions du même schéma :
// - GuaranteeTableSchema (Zod) : valide la réponse et donne le type TypeScript ;
// - GEMINI_GUARANTEE_SCHEMA (format OpenAPI) : envoyé à Gemini dans responseSchema.

import { z } from "zod";

export const CATEGORIES = ["soins_courants", "hospitalisation", "optique", "dentaire", "medecine_douce", "autre"] as const;
export const UNITES = ["% BR", "euros", "euros par an", "euros par jour", "non couvert", "autre"] as const;

export const GuaranteeSchema = z.object({
  categorie: z.enum(CATEGORIES),
  soin: z.string().min(1), // ex. "Consultation spécialiste secteur 2 non OPTAM"
  formule: z.string().min(1), // ex. "Équilibre"
  valeur: z.number().nullable(), // ex. 150 ; null si non couvert
  unite: z.enum(UNITES),
  conditions: z.string().nullable(), // plafonds, délais, limites
  page: z.number().int().positive().nullable(), // page du document où figure l'information
});

export const GuaranteeTableSchema = z.object({
  organisme: z.string(),
  annee: z.number().int().nullable(),
  formules: z.array(z.string()),
  garanties: z.array(GuaranteeSchema),
});

export type Guarantee = z.infer<typeof GuaranteeSchema>;
export type GuaranteeTable = z.infer<typeof GuaranteeTableSchema>;

// Même structure, au format attendu par l'API Gemini
export const GEMINI_GUARANTEE_SCHEMA = {
  type: "OBJECT",
  properties: {
    organisme: { type: "STRING" },
    annee: { type: "INTEGER", nullable: true },
    formules: { type: "ARRAY", items: { type: "STRING" } },
    garanties: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          categorie: { type: "STRING", enum: [...CATEGORIES] },
          soin: { type: "STRING" },
          formule: { type: "STRING" },
          valeur: { type: "NUMBER", nullable: true },
          unite: { type: "STRING", enum: [...UNITES] },
          conditions: { type: "STRING", nullable: true },
          page: { type: "INTEGER", nullable: true },
        },
        required: ["categorie", "soin", "formule", "valeur", "unite", "conditions", "page"],
        propertyOrdering: ["categorie", "soin", "formule", "valeur", "unite", "conditions", "page"],
      },
    },
  },
  required: ["organisme", "annee", "formules", "garanties"],
  propertyOrdering: ["organisme", "annee", "formules", "garanties"],
};
