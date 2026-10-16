// Garanties de base de Vita Mutuelle, toujours affichées sur la page /garanties.
// Mêmes chiffres que le « Tableau des garanties 2026 » (public/documents) et la notice,
// au même format que les extractions : la page les affiche avec le même composant.

import type { Guarantee, GuaranteeTable } from "./schemas";

const PRODUIT = "Vita Santé";
const FORMULES = ["Essentielle", "Équilibre", "Sérénité"] as const;

// Une ligne par soin, trois valeurs (une par formule). null = non couvert.
type Line = {
  categorie: Guarantee["categorie"];
  soin: string;
  unite: Guarantee["unite"];
  valeurs: [number | null, number | null, number | null];
  conditions?: string;
  page: number;
};

const LINES: Line[] = [
  { categorie: "soins_courants", soin: "Consultation généraliste", unite: "% BR", valeurs: [100, 100, 100], page: 1 },
  { categorie: "soins_courants", soin: "Spécialiste secteur 2 non OPTAM", unite: "% BR", valeurs: [100, 150, 200], page: 1 },
  { categorie: "soins_courants", soin: "Spécialiste OPTAM", unite: "% BR", valeurs: [120, 170, 220], page: 1 },
  { categorie: "soins_courants", soin: "Pharmacie remboursable", unite: "% BR", valeurs: [100, 100, 100], page: 1 },
  { categorie: "hospitalisation", soin: "Frais de séjour", unite: "% BR", valeurs: [100, 100, 100], conditions: "Forfait journalier sans limite de durée", page: 1 },
  { categorie: "hospitalisation", soin: "Chambre particulière", unite: "euros par jour", valeurs: [null, 40, 70], conditions: "60 jours par an en soins de suite", page: 1 },
  { categorie: "optique", soin: "Lunettes 100 % Santé", unite: "frais réels", valeurs: [null, null, null], conditions: "Sans reste à charge", page: 1 },
  { categorie: "optique", soin: "Lunettes hors 100 % Santé", unite: "euros par an", valeurs: [100, 200, 350], conditions: "Monture limitée à 100 €, tous les 2 ans pour un adulte", page: 1 },
  { categorie: "dentaire", soin: "Soins dentaires courants", unite: "% BR", valeurs: [100, 100, 100], conditions: "Détartrage, carie", page: 1 },
  { categorie: "dentaire", soin: "Prothèses 100 % Santé", unite: "frais réels", valeurs: [null, null, null], conditions: "Sans reste à charge", page: 1 },
  { categorie: "dentaire", soin: "Couronne hors 100 % Santé", unite: "% BR", valeurs: [125, 200, 300], page: 1 },
  { categorie: "dentaire", soin: "Orthodontie enfant", unite: "% BR", valeurs: [150, 250, 350], conditions: "Par semestre, moins de 16 ans", page: 1 },
  { categorie: "autre", soin: "Aide auditive 100 % Santé", unite: "frais réels", valeurs: [null, null, null], conditions: "950 € par oreille, tous les 4 ans", page: 1 },
  { categorie: "autre", soin: "Aide auditive classe II", unite: "euros", valeurs: [400, 700, 1000], conditions: "Par oreille", page: 1 },
  { categorie: "medecine_douce", soin: "Ostéopathie, diététique, sophrologie", unite: "euros par an", valeurs: [null, 120, 250], conditions: "40 € par séance, après 3 mois d'adhésion", page: 1 },
];

export const VITA_TABLE: GuaranteeTable = {
  organisme: "Vita Mutuelle",
  annee: 2026,
  formules: [
    { produit: PRODUIT, nom: "Essentielle", cotisation_mensuelle: 29 },
    { produit: PRODUIT, nom: "Équilibre", cotisation_mensuelle: 48 },
    { produit: PRODUIT, nom: "Sérénité", cotisation_mensuelle: 74 },
  ],
  garanties: LINES.flatMap((l) =>
    FORMULES.map((formule, i) => {
      const valeur = l.valeurs[i];
      const notCovered = valeur === null && l.unite !== "frais réels";
      return {
        produit: PRODUIT,
        categorie: l.categorie,
        soin: l.soin,
        formule,
        valeur,
        unite: notCovered ? ("non couvert" as const) : l.unite,
        conditions: l.conditions ?? null,
        page: l.page,
      };
    }),
  ),
};

export const VITA_SOURCE = {
  title: "Tableau des garanties 2026",
  url: "/documents/vita-tableau-garanties-2026.pdf",
  pageCount: 1,
};
