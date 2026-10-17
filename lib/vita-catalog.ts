// Offre de base de Vita Mutuelle : sa gamme de produits, toujours affichée sur la page /garanties.
// C'est la SOURCE UNIQUE de ces données : le PDF « Gamme Vita 2026 » (indexé pour Vita) est généré
// à partir d'elles (npm run gamme), la page Garanties et l'orientation les lisent directement.
// Même format que les extractions : un seul composant affiche l'offre de base et les offres extraites.

import type { Guarantee, GuaranteeTable } from "./schemas";

// Une ligne par soin, une valeur par formule (même ordre que les formules). null = non couvert.
type Line = {
  categorie: Guarantee["categorie"];
  soin: string;
  unite: Guarantee["unite"];
  valeurs: (number | null)[];
  conditions?: string;
};

type ProductDef = {
  nom: string;
  description: string; // présentation courte, reprise dans le PDF
  page: number; // page du produit dans le PDF « Gamme Vita 2026 »
  formules: { nom: string; prix: number }[];
  lines: Line[];
};

export const VITA_PRODUCTS: ProductDef[] = [
  {
    nom: "Vita Santé",
    description: "La complémentaire santé de toute la famille, en trois niveaux de garanties.",
    page: 1,
    formules: [
      { nom: "Essentielle", prix: 29 },
      { nom: "Équilibre", prix: 48 },
      { nom: "Sérénité", prix: 74 },
    ],
    lines: [
  { categorie: "soins_courants", soin: "Consultation généraliste", unite: "% BR", valeurs: [100, 100, 100] },
  { categorie: "soins_courants", soin: "Spécialiste secteur 2 non OPTAM", unite: "% BR", valeurs: [100, 150, 200] },
  { categorie: "soins_courants", soin: "Spécialiste OPTAM", unite: "% BR", valeurs: [120, 170, 220] },
  { categorie: "soins_courants", soin: "Pharmacie remboursable", unite: "% BR", valeurs: [100, 100, 100] },
  { categorie: "hospitalisation", soin: "Frais de séjour", unite: "% BR", valeurs: [100, 100, 100], conditions: "Forfait journalier sans limite de durée" },
  { categorie: "hospitalisation", soin: "Chambre particulière", unite: "euros par jour", valeurs: [null, 40, 70], conditions: "60 jours par an en soins de suite" },
  { categorie: "optique", soin: "Lunettes 100 % Santé", unite: "frais réels", valeurs: [null, null, null], conditions: "Sans reste à charge" },
  { categorie: "optique", soin: "Lunettes hors 100 % Santé", unite: "euros par an", valeurs: [100, 200, 350], conditions: "Monture limitée à 100 €, tous les 2 ans pour un adulte" },
  { categorie: "dentaire", soin: "Soins dentaires courants", unite: "% BR", valeurs: [100, 100, 100], conditions: "Détartrage, carie" },
  { categorie: "dentaire", soin: "Prothèses 100 % Santé", unite: "frais réels", valeurs: [null, null, null], conditions: "Sans reste à charge" },
  { categorie: "dentaire", soin: "Couronne hors 100 % Santé", unite: "% BR", valeurs: [125, 200, 300] },
  { categorie: "dentaire", soin: "Orthodontie enfant", unite: "% BR", valeurs: [150, 250, 350], conditions: "Par semestre, moins de 16 ans" },
  { categorie: "autre", soin: "Aide auditive 100 % Santé", unite: "frais réels", valeurs: [null, null, null], conditions: "950 € par oreille, tous les 4 ans" },
  { categorie: "autre", soin: "Aide auditive classe II", unite: "euros", valeurs: [400, 700, 1000], conditions: "Par oreille" },
  { categorie: "medecine_douce", soin: "Ostéopathie, diététique, sophrologie", unite: "euros par an", valeurs: [null, 120, 250], conditions: "40 € par séance, après 3 mois d'adhésion" },
    ],
  },
  {
    nom: "Vita Santé Jeunes",
    description: "Pour les 18 à 30 ans : l'essentiel des soins courants à petit prix, avec un forfait sport et prévention.",
    page: 2,
    formules: [
      { nom: "Jeunes Essentiel", prix: 15 },
      { nom: "Jeunes Actif", prix: 24 },
    ],
    lines: [
      { categorie: "soins_courants", soin: "Consultation généraliste", unite: "% BR", valeurs: [100, 100] },
      { categorie: "soins_courants", soin: "Spécialiste secteur 2 non OPTAM", unite: "% BR", valeurs: [100, 150] },
      { categorie: "soins_courants", soin: "Pharmacie remboursable", unite: "% BR", valeurs: [100, 100] },
      { categorie: "hospitalisation", soin: "Frais de séjour", unite: "% BR", valeurs: [100, 100] },
      { categorie: "hospitalisation", soin: "Chambre particulière", unite: "euros par jour", valeurs: [null, 30], conditions: "30 jours par an" },
      { categorie: "optique", soin: "Lunettes ou lentilles hors 100 % Santé", unite: "euros par an", valeurs: [80, 150] },
      { categorie: "dentaire", soin: "Couronne hors 100 % Santé", unite: "% BR", valeurs: [125, 175] },
      { categorie: "medecine_douce", soin: "Ostéopathie, diététique, psychologue", unite: "euros par an", valeurs: [60, 120], conditions: "30 € par séance" },
      { categorie: "autre", soin: "Forfait sport et prévention", unite: "euros par an", valeurs: [null, 50], conditions: "Licence sportive, vaccins non remboursés" },
    ],
  },
  {
    nom: "Vita Santé Senior",
    description: "À partir de 60 ans : hospitalisation, optique, audition et dentaire renforcés, avec une cure thermale.",
    page: 3,
    formules: [
      { nom: "Senior Confort", prix: 89 },
      { nom: "Senior Intégral", prix: 119 },
    ],
    lines: [
      { categorie: "soins_courants", soin: "Consultation généraliste", unite: "% BR", valeurs: [100, 100] },
      { categorie: "soins_courants", soin: "Spécialiste secteur 2 non OPTAM", unite: "% BR", valeurs: [150, 200] },
      { categorie: "hospitalisation", soin: "Frais de séjour", unite: "% BR", valeurs: [100, 100] },
      { categorie: "hospitalisation", soin: "Chambre particulière", unite: "euros par jour", valeurs: [70, 90], conditions: "Sans limite de durée en médecine et chirurgie" },
      { categorie: "optique", soin: "Lunettes hors 100 % Santé", unite: "euros par an", valeurs: [300, 400], conditions: "Verres progressifs inclus" },
      { categorie: "dentaire", soin: "Couronne hors 100 % Santé", unite: "% BR", valeurs: [250, 350] },
      { categorie: "dentaire", soin: "Implant dentaire", unite: "euros par an", valeurs: [400, 700] },
      { categorie: "autre", soin: "Aide auditive classe II", unite: "euros", valeurs: [900, 1200], conditions: "Par oreille, tous les 4 ans" },
      { categorie: "autre", soin: "Cure thermale prescrite", unite: "euros par an", valeurs: [150, 250] },
      { categorie: "medecine_douce", soin: "Ostéopathie, kinésithérapie non remboursée", unite: "euros par an", valeurs: [200, 300] },
    ],
  },
  {
    nom: "Vita Prévoyance Indépendants",
    description: "Pour les professions libérales, artisans et commerçants : un revenu de remplacement en cas d'arrêt de travail.",
    page: 4,
    formules: [
      { nom: "Revenus Essentiel", prix: 35 },
      { nom: "Revenus Confort", prix: 59 },
    ],
    lines: [
      { categorie: "autre", soin: "Indemnités journalières en arrêt de travail", unite: "euros par jour", valeurs: [50, 80], conditions: "À partir du 4e jour, jusqu'à 3 ans" },
      { categorie: "autre", soin: "Rente d'invalidité", unite: "euros", valeurs: [1000, 1800], conditions: "Par mois, invalidité totale" },
      { categorie: "autre", soin: "Capital décès", unite: "euros", valeurs: [50000, 100000] },
      { categorie: "hospitalisation", soin: "Indemnité d'hospitalisation", unite: "euros par jour", valeurs: [30, 50], conditions: "Dès le 1er jour" },
    ],
  },
  {
    nom: "Vita Prévoyance Décès",
    description: "Protéger ses proches : un capital versé au conjoint et une rente pour les études des enfants.",
    page: 5,
    formules: [
      { nom: "Famille Essentiel", prix: 12 },
      { nom: "Famille Plus", prix: 22 },
    ],
    lines: [
      { categorie: "autre", soin: "Capital décès", unite: "euros", valeurs: [50000, 100000], conditions: "Versé aux bénéficiaires désignés" },
      { categorie: "autre", soin: "Rente éducation par enfant", unite: "euros par an", valeurs: [3000, 6000], conditions: "Jusqu'aux 25 ans de l'enfant" },
      { categorie: "autre", soin: "Perte totale et irréversible d'autonomie", unite: "euros", valeurs: [50000, 100000], conditions: "Capital versé par anticipation" },
      { categorie: "autre", soin: "Frais d'obsèques", unite: "euros", valeurs: [3000, 5000] },
    ],
  },
];

export const VITA_TABLE: GuaranteeTable = {
  organisme: "Vita Mutuelle",
  annee: 2026,
  formules: VITA_PRODUCTS.flatMap((p) => p.formules.map((f) => ({ produit: p.nom, nom: f.nom, cotisation_mensuelle: f.prix }))),
  garanties: VITA_PRODUCTS.flatMap((p) =>
    p.lines.flatMap((l) =>
      p.formules.map((f, i) => {
        const valeur = l.valeurs[i] ?? null;
        const notCovered = valeur === null && l.unite !== "frais réels";
        return {
          produit: p.nom,
          categorie: l.categorie,
          soin: l.soin,
          formule: f.nom,
          valeur,
          unite: notCovered ? ("non couvert" as const) : l.unite,
          conditions: l.conditions ?? null,
          page: p.page,
        };
      }),
    ),
  ),
};

export const VITA_SOURCE = {
  title: "Gamme Vita 2026",
  url: "/documents/vita-gamme-2026.pdf",
  pageCount: VITA_PRODUCTS.length,
};
