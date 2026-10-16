"""Génère data/vita-notice-2026.pdf : la notice d'information de Vita Mutuelle.

Vita Mutuelle est FICTIVE. Ce document de démonstration a été rédigé pour le projet ;
il ne reprend aucun document interne d'un assureur réel.
Les chiffres sont cohérents avec le tableau des garanties affiché sur le site.

Usage : python scripts/generate-notice.py   (nécessite reportlab)
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer

PAGES = [
    (
        "Notice d'information 2026 - Vita Mutuelle",
        [
            ("Objet de la notice", "Cette notice présente les garanties santé de Vita Mutuelle pour l'année 2026. Elle s'applique aux trois formules proposées : Essentielle, Équilibre et Sérénité. Les cotisations mensuelles de départ sont de 29 euros pour Essentielle, 48 euros pour Équilibre et 74 euros pour Sérénité, par adulte."),
            ("Base de remboursement (BR)", "La base de remboursement est le tarif de référence fixé par la Sécurité sociale pour chaque acte. Les garanties exprimées en pourcentage de la BR incluent le remboursement de la Sécurité sociale. Par exemple, une garantie à 150 % BR signifie que la Sécurité sociale et Vita Mutuelle remboursent ensemble jusqu'à 1,5 fois la base de remboursement."),
            ("Ticket modérateur", "Le ticket modérateur est la partie de la base de remboursement qui n'est pas prise en charge par la Sécurité sociale. Pour une consultation de médecin, la Sécurité sociale rembourse 70 % de la BR : le ticket modérateur représente donc 30 % de la BR. Toutes les formules de Vita Mutuelle remboursent le ticket modérateur."),
            ("Participation forfaitaire", "Une participation forfaitaire de 2 euros est déduite par la Sécurité sociale sur chaque consultation. Conformément aux règles des contrats responsables, Vita Mutuelle ne rembourse pas cette participation forfaitaire, ni les franchises médicales."),
            ("Dépassements d'honoraires", "Un médecin de secteur 2 peut facturer plus que la base de remboursement : c'est un dépassement d'honoraires. Les médecins adhérents à l'OPTAM limitent leurs dépassements. Les garanties de Vita Mutuelle pour un médecin non adhérent à l'OPTAM sont plafonnées à 200 % de la BR, conformément à la réglementation."),
        ],
    ),
    (
        "Soins courants et consultations",
        [
            ("Consultation chez un généraliste", "Les trois formules remboursent la consultation d'un médecin généraliste à 100 % de la BR. Pour un généraliste de secteur 1 qui applique le tarif de convention, il ne reste donc à payer que la participation forfaitaire de 2 euros."),
            ("Consultation chez un spécialiste", "Pour une consultation chez un spécialiste de secteur 2 non adhérent à l'OPTAM, le remboursement total est de 100 % BR avec la formule Essentielle, 150 % BR avec la formule Équilibre et 200 % BR avec la formule Sérénité. Pour un spécialiste adhérent à l'OPTAM, ces niveaux sont augmentés de 20 points de BR, sans dépasser 220 % BR pour Sérénité."),
            ("Exemple de calcul", "Un adhérent en formule Équilibre consulte un dermatologue de secteur 2 non adhérent à l'OPTAM, qui facture 60 euros. La base de remboursement est de 23 euros. La Sécurité sociale rembourse 70 % de 23 euros, soit 16,10 euros, moins la participation forfaitaire de 2 euros : 14,10 euros. La garantie Équilibre couvre 150 % de 23 euros, soit 34,50 euros au total ; Vita Mutuelle verse donc 34,50 - 16,10 = 18,40 euros. Il reste 27,50 euros à la charge de l'adhérent."),
            ("Pharmacie", "Les médicaments remboursés par la Sécurité sociale sont pris en charge à 100 % de la BR dans les trois formules. Les médicaments non remboursables ne sont pas couverts."),
        ],
    ),
    (
        "Optique et dentaire",
        [
            ("Équipements 100 % Santé", "Les lunettes et les prothèses dentaires du panier 100 % Santé sont intégralement remboursées dans les trois formules, sans reste à charge, dans la limite des prix limites de vente fixés par la réglementation."),
            ("Lunettes hors 100 % Santé", "Pour des lunettes hors panier 100 % Santé (verres et monture), Vita Mutuelle verse un forfait par an et par bénéficiaire : 100 euros avec Essentielle, 200 euros avec Équilibre et 350 euros avec Sérénité. Ce forfait inclut le remboursement de la Sécurité sociale. La monture est prise en charge dans la limite de 100 euros."),
            ("Renouvellement des lunettes", "Un équipement d'optique est remboursé une fois tous les deux ans pour un adulte, et une fois par an pour un enfant de moins de 16 ans ou en cas d'évolution de la vue constatée par un ophtalmologiste ou un opticien."),
            ("Couronne dentaire hors 100 % Santé", "Pour une couronne dentaire hors panier 100 % Santé, le remboursement total est de 125 % BR avec Essentielle, 200 % BR avec Équilibre et 300 % BR avec Sérénité. Les soins dentaires courants (détartrage, carie) sont remboursés à 100 % BR dans toutes les formules."),
            ("Orthodontie", "L'orthodontie acceptée par la Sécurité sociale pour un enfant de moins de 16 ans est remboursée à 150 % BR avec Essentielle, 250 % BR avec Équilibre et 350 % BR avec Sérénité, par semestre de traitement."),
        ],
    ),
    (
        "Hospitalisation, médecine douce et démarches",
        [
            ("Frais de séjour et forfait journalier", "En cas d'hospitalisation, les frais de séjour sont remboursés à 100 % BR et le forfait journalier hospitalier est pris en charge sans limite de durée, dans les trois formules."),
            ("Chambre particulière", "La chambre particulière n'est pas couverte par la formule Essentielle. Elle est remboursée à hauteur de 40 euros par jour avec Équilibre et de 70 euros par jour avec Sérénité, dans la limite de 60 jours par an en établissement de soins de suite."),
            ("Médecine douce", "Les séances d'ostéopathie, de chiropraxie, de diététique et de sophrologie ne sont pas couvertes par la formule Essentielle. Elles sont remboursées dans la limite d'un forfait annuel de 120 euros avec Équilibre et de 250 euros avec Sérénité, à raison de 40 euros maximum par séance. Le praticien doit être enregistré au répertoire ADELI ou RPPS."),
            ("Délai d'attente", "Aucun délai d'attente ne s'applique aux soins courants. Pour la chambre particulière et la médecine douce, les garanties s'appliquent après un délai de trois mois à compter de l'adhésion."),
            ("Démarches de remboursement", "Grâce à la télétransmission avec la Sécurité sociale (liaison NOEMIE), la plupart des remboursements sont automatiques, sous 48 heures en moyenne. Pour l'optique, le dentaire hors tiers payant et la médecine douce, l'adhérent envoie la facture acquittée depuis son espace adhérent. Les demandes doivent être faites dans un délai de deux ans après la date des soins."),
            ("Exclusions", "Ne sont pas remboursés : la participation forfaitaire et les franchises médicales, les actes de chirurgie esthétique non pris en charge par la Sécurité sociale, les cures thermales hors prescription, et les dépassements d'honoraires au-delà des plafonds indiqués dans cette notice."),
        ],
    ),
]


def build(path: str) -> None:
    styles = getSampleStyleSheet()
    doc = SimpleDocTemplate(path, pagesize=A4, leftMargin=2.2 * cm, rightMargin=2.2 * cm, title="Notice d'information 2026 - Vita Mutuelle")
    story = []
    for i, (title, sections) in enumerate(PAGES):
        story.append(Paragraph(title, styles["Title"] if i == 0 else styles["Heading1"]))
        if i == 0:
            story.append(Paragraph("Document de démonstration : Vita Mutuelle est une mutuelle fictive.", styles["Italic"]))
        for heading, text in sections:
            story.append(Spacer(1, 8))
            story.append(Paragraph(heading, styles["Heading3"]))
            story.append(Paragraph(text, styles["BodyText"]))
        if i < len(PAGES) - 1:
            story.append(PageBreak())
    doc.build(story)


if __name__ == "__main__":
    build("data/vita-notice-2026.pdf")
    print("data/vita-notice-2026.pdf généré")
