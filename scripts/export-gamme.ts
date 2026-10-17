// Exporte la gamme Vita (lib/vita-catalog.ts) en JSON sur la sortie standard,
// pour que scripts/generate-gamme.py en fasse le PDF « Gamme Vita 2026 ».
// Une seule source de vérité : la page Garanties et le PDF lu par Vita ne peuvent pas diverger.
import { VITA_PRODUCTS } from "../lib/vita-catalog";

process.stdout.write(JSON.stringify(VITA_PRODUCTS));
