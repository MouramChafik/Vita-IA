"""Génère public/documents/vita-gamme-2026.pdf à partir de la gamme Vita (JSON sur l'entrée standard).

Usage : npm run gamme   (export TypeScript -> ce script ; nécessite reportlab)
Une page par produit : présentation, formules et tarifs, tableau des garanties.
"""

import json
import sys

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

UNITS = {"% BR": "% BR", "euros": "€", "euros par an": "€ / an", "euros par jour": "€ / jour", "frais réels": "Frais réels"}


def fmt(value, unit):
    if unit == "frais réels":
        return "Frais réels"
    if value is None:
        return "Non couvert"
    number = f"{value:,.0f}".replace(",", " ")
    return f"{number} {UNITS.get(unit, unit)}"


def build(products, path):
    styles = getSampleStyleSheet()
    cell = styles["BodyText"].clone("cell", fontSize=8.5, leading=10.5)
    doc = SimpleDocTemplate(path, pagesize=A4, leftMargin=1.6 * cm, rightMargin=1.6 * cm, title="Gamme Vita 2026 - Vita Mutuelle")
    story = []
    for i, p in enumerate(products):
        story.append(Paragraph(f"Gamme Vita 2026 - {p['nom']}", styles["Title"] if i == 0 else styles["Heading1"]))
        if i == 0:
            story.append(Paragraph("Document de démonstration : Vita Mutuelle est une mutuelle fictive. BR : base de remboursement de la Sécurité sociale. Les remboursements incluent la part de la Sécurité sociale.", styles["Italic"]))
        story.append(Paragraph(p["description"], styles["BodyText"]))
        story.append(Spacer(1, 8))
        prices = ", ".join(f"{f['nom']} {f['prix']} euros" for f in p["formules"])
        story.append(Paragraph(f"Formules et cotisations mensuelles par adulte : {prices}.", styles["BodyText"]))
        story.append(Spacer(1, 10))

        header = ["Garantie"] + [f["nom"] for f in p["formules"]]
        rows = [header]
        for line in p["lines"]:
            label = line["soin"] + (f" ({line['conditions']})" if line.get("conditions") else "")
            rows.append([Paragraph(label, cell)] + [fmt(v, line["unite"]) for v in line["valeurs"]])
        first = 8.5 * cm
        other = (A4[0] - 3.2 * cm - first) / len(p["formules"])
        table = Table(rows, colWidths=[first] + [other] * len(p["formules"]))
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0b6e5e")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8.5),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#d5e3dd")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f2f7f4")]),
        ]))
        story.append(table)
        if i < len(products) - 1:
            story.append(PageBreak())
    doc.build(story)


if __name__ == "__main__":
    build(json.load(sys.stdin), "public/documents/vita-gamme-2026.pdf")
    print("public/documents/vita-gamme-2026.pdf généré")
