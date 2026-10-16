"""Génère les documents de démonstration de Vita Mutuelle dans public/documents/ :
- vita-notice-2026.pdf : notice d'information (texte)
- vita-tableau-garanties-2026.pdf : tableau des garanties (vrai tableau, utile pour tester l'extraction JSON)
- vita-guide-100-sante.pdf : guide du 100 % Santé

Vita Mutuelle est FICTIVE. Ce document de démonstration a été rédigé pour le projet ;
il ne reprend aucun document interne d'un assureur réel.
Les chiffres sont cohérents avec le tableau des garanties affiché sur le site.

Usage : python scripts/generate-documents.py   (nécessite reportlab)
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

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


def build(path: str, pages, title: str) -> None:
    styles = getSampleStyleSheet()
    doc = SimpleDocTemplate(path, pagesize=A4, leftMargin=2.2 * cm, rightMargin=2.2 * cm, title=title)
    story = []
    for i, (title, sections) in enumerate(pages):
        story.append(Paragraph(title, styles["Title"] if i == 0 else styles["Heading1"]))
        if i == 0:
            story.append(Paragraph("Document de démonstration : Vita Mutuelle est une mutuelle fictive.", styles["Italic"]))
        for heading, text in sections:
            story.append(Spacer(1, 8))
            story.append(Paragraph(heading, styles["Heading3"]))
            story.append(Paragraph(text, styles["BodyText"]))
        if i < len(pages) - 1:
            story.append(PageBreak())
    doc.build(story)


GUIDE_100_SANTE = [
    (
        "Guide du 100 % Santé - Vita Mutuelle",
        [
            ("Qu'est-ce que le 100 % Santé ?", "Le 100 % Santé est une réforme nationale qui permet d'obtenir certaines lunettes, prothèses dentaires et aides auditives sans reste à charge. La Sécurité sociale et la complémentaire santé remboursent ensemble la totalité du prix, à condition de choisir un équipement du panier 100 % Santé et que le professionnel respecte les prix limites de vente."),
            ("Qui peut en bénéficier ?", "Tous les adhérents de Vita Mutuelle, quelle que soit leur formule (Essentielle, Équilibre ou Sérénité), car les trois formules sont des contrats responsables. Il suffit d'avoir une prescription médicale et de demander un devis 100 % Santé au professionnel."),
            ("Le devis obligatoire", "Les opticiens, dentistes et audioprothésistes doivent remettre un devis qui présente au moins une offre 100 % Santé. Vous pouvez envoyer ce devis à Vita Mutuelle depuis votre espace adhérent : la réponse indique votre reste à charge exact sous 48 heures."),
        ],
    ),
    (
        "Optique, dentaire et audition",
        [
            ("Lunettes 100 % Santé (classe A)", "Les lunettes de classe A comprennent une monture à 30 euros maximum et des verres traités contre les reflets et les rayures. L'opticien doit proposer au moins 17 modèles de montures adultes et 10 modèles enfants en deux couleurs. Le renouvellement suit les mêmes règles que les autres lunettes : tous les deux ans pour un adulte."),
            ("Panachage des lunettes", "Il est possible de combiner une monture hors 100 % Santé avec des verres 100 % Santé, ou l'inverse. Dans ce cas, la partie hors panier est remboursée selon le forfait optique de votre formule."),
            ("Prothèses dentaires 100 % Santé", "Le panier 100 % Santé couvre les couronnes, bridges et dentiers, avec des matériaux qui dépendent de la position de la dent : céramique pour les dents visibles, métal pour les molaires. Pour une couronne hors panier, c'est la garantie de votre formule qui s'applique (125 %, 200 % ou 300 % de la BR)."),
            ("Aides auditives 100 % Santé (classe I)", "Les aides auditives de classe I sont remboursées intégralement, dans la limite de 950 euros par oreille. Elles peuvent être renouvelées tous les quatre ans. Pour une aide auditive de classe II, hors 100 % Santé, Vita Mutuelle rembourse 400 euros par oreille avec Essentielle, 700 euros avec Équilibre et 1 000 euros avec Sérénité, Sécurité sociale incluse."),
        ],
    ),
]

TABLE_ROWS = [
    ["Poste", "Soin", "Essentielle", "Équilibre", "Sérénité"],
    ["Soins courants", "Consultation généraliste", "100 % BR", "100 % BR", "100 % BR"],
    ["Soins courants", "Spécialiste secteur 2 non OPTAM", "100 % BR", "150 % BR", "200 % BR"],
    ["Soins courants", "Spécialiste OPTAM", "120 % BR", "170 % BR", "220 % BR"],
    ["Soins courants", "Pharmacie remboursable", "100 % BR", "100 % BR", "100 % BR"],
    ["Hospitalisation", "Frais de séjour", "100 % BR", "100 % BR", "100 % BR"],
    ["Hospitalisation", "Chambre particulière (par jour)", "Non couvert", "40 euros", "70 euros"],
    ["Optique", "Lunettes hors 100 % Santé (par an)", "100 euros", "200 euros", "350 euros"],
    ["Dentaire", "Couronne hors 100 % Santé", "125 % BR", "200 % BR", "300 % BR"],
    ["Dentaire", "Orthodontie enfant (par semestre)", "150 % BR", "250 % BR", "350 % BR"],
    ["Audition", "Aide auditive classe II (par oreille)", "400 euros", "700 euros", "1 000 euros"],
    ["Médecine douce", "Ostéopathie, diététique (par an)", "Non couvert", "120 euros", "250 euros"],
]


def build_table(path: str) -> None:
    styles = getSampleStyleSheet()
    doc = SimpleDocTemplate(path, pagesize=A4, leftMargin=1.6 * cm, rightMargin=1.6 * cm, title="Tableau des garanties 2026 - Vita Mutuelle")
    table = Table(TABLE_ROWS, colWidths=[3.2 * cm, 6.2 * cm, 2.6 * cm, 2.6 * cm, 2.6 * cm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0b6e5e")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#d5e3dd")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f2f7f4")]),
    ]))
    story = [
        Paragraph("Tableau des garanties 2026 - Vita Mutuelle", styles["Title"]),
        Paragraph("Document de démonstration : Vita Mutuelle est une mutuelle fictive. BR : base de remboursement de la Sécurité sociale. Les remboursements incluent la part de la Sécurité sociale.", styles["BodyText"]),
        Spacer(1, 12),
        table,
        Spacer(1, 12),
        Paragraph("Cotisations mensuelles de départ par adulte : Essentielle 29 euros, Équilibre 48 euros, Sérénité 74 euros.", styles["BodyText"]),
    ]
    doc.build(story)


if __name__ == "__main__":
    build("public/documents/vita-notice-2026.pdf", PAGES, "Notice d'information 2026 - Vita Mutuelle")
    build("public/documents/vita-guide-100-sante.pdf", GUIDE_100_SANTE, "Guide du 100 % Santé - Vita Mutuelle")
    build_table("public/documents/vita-tableau-garanties-2026.pdf")
    print("3 documents générés dans public/documents/")
