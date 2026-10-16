// Évaluation du RAG sur les questions de référence (eval/questions.json).
//
// Usage :
//   npm run eval                        évaluation complète (recherche + génération)
//   npm run eval -- --retrieval-only    recherche seulement (rapide, ne consomme pas le quota de génération)
//   npm run eval -- --save-baseline     enregistre le résultat comme nouvelle référence
//
// Quatre métriques (en %) :
//   recherche  : un passage du bon document, à la bonne page, fait partie des passages retrouvés
//   citation   : la réponse cite bien ce document et cette page
//   réponse    : la réponse contient les informations attendues (ou refuse si la question est hors documents)
//   sans invention : aucun nombre de la réponse n'est absent des extraits fournis
//
// Le script compare à eval/baseline.json et échoue (code 1) si une métrique baisse de plus de 5 points.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { GeminiError } from "../lib/gemini";
import { answerQuestion } from "../lib/rag";
import { searchPassages } from "../lib/retrieval";
import { containsAll, inventedNumbers, isRefusal } from "./scoring";

type ExpectedSource = { document: string; page: number };
type Case = { id: string; question: string; expected_sources: ExpectedSource[]; must_contain: string[] };

// Un passage correspond si c'est le bon document à la bonne page (plusieurs sources peuvent être valables)
const matches = (expected: ExpectedSource[], title: string, page: number) =>
  expected.some((e) => e.document === title && e.page === page);
type Metric = "retrieval" | "citation" | "answer" | "grounded";
type Row = { id: string } & Partial<Record<Metric, boolean>> & { detail?: string };

const args = process.argv.slice(2);
const RETRIEVAL_ONLY = args.includes("--retrieval-only");
const SAVE_BASELINE = args.includes("--save-baseline");
const DELAY_MS = Number(process.env.EVAL_DELAY_MS ?? 4000); // palier gratuit : limite de requêtes par minute
const MAX_DROP = 5; // points de pourcentage tolérés avant de signaler une régression

const LABELS: Record<Metric, string> = {
  retrieval: "Recherche (bonne page retrouvée)",
  citation: "Citation (bonne page citée)",
  answer: "Réponse correcte",
  grounded: "Sans invention",
};

async function evaluate(c: Case): Promise<Row> {
  const answerable = c.expected_sources.length > 0;

  if (RETRIEVAL_ONLY) {
    const passages = await searchPassages(c.question);
    return answerable
      ? { id: c.id, retrieval: passages.some((p) => matches(c.expected_sources, p.document_title, p.page)) }
      : { id: c.id }; // une question hors documents n'a pas de page attendue
  }

  const { answer, sources, passages } = await answerQuestion(c.question);
  const context = passages.map((p) => p.content).join("\n") + "\n" + c.question;
  const invented = inventedNumbers(answer, context);
  const row: Row = { id: c.id, grounded: invented.length === 0 };

  if (answerable) {
    row.retrieval = passages.some((p) => matches(c.expected_sources, p.document_title, p.page));
    row.citation = sources.some((s) => matches(c.expected_sources, s.title, s.page));
    row.answer = !isRefusal(answer) && containsAll(answer, c.must_contain);
  } else {
    row.answer = isRefusal(answer); // attendu : Vita refuse de répondre
  }

  if (!row.answer || !row.grounded) {
    row.detail = `${invented.length ? `nombres inventés: ${invented.join(", ")} | ` : ""}${answer.slice(0, 160)}`;
  }
  return row;
}

function score(rows: Row[], metric: Metric): number | null {
  const values = rows.map((r) => r[metric]).filter((v): v is boolean => v !== undefined);
  return values.length ? Math.round((100 * values.filter(Boolean).length) / values.length) : null;
}

async function main() {
  const cases: Case[] = JSON.parse(await readFile("eval/questions.json", "utf8"));
  console.log(`Évaluation de ${cases.length} questions${RETRIEVAL_ONLY ? " (recherche seulement)" : ""}\n`);

  const rows: Row[] = [];
  for (const [i, c] of cases.entries()) {
    if (i > 0 && !RETRIEVAL_ONLY) await new Promise((r) => setTimeout(r, DELAY_MS));
    let row: Row;
    try {
      // Une erreur réseau passagère ("fetch failed") mérite une seconde chance
      row = await evaluate(c).catch((err) => {
        if (err instanceof GeminiError) throw err;
        return evaluate(c);
      });
    } catch (err) {
      // Quota épuisé sur tous les modèles : continuer fausserait le score, on s'arrête
      if (err instanceof GeminiError && err.status === 429) {
        console.error(`\nQuota Gemini épuisé à la question ${i + 1}. Évaluation interrompue, rien n'est enregistré.`);
        console.error("Relancez plus tard (le quota gratuit se réinitialise chaque jour) ou activez la facturation.");
        process.exit(2);
      }
      // Autre erreur technique : comptée comme un échec, pour ne pas gonfler le score
      row = { id: c.id, retrieval: false, citation: false, answer: false, grounded: false, detail: String(err) };
    }
    rows.push(row);
    const marks = (Object.keys(LABELS) as Metric[])
      .filter((m) => row[m] !== undefined)
      .map((m) => `${m}:${row[m] ? "ok" : "KO"}`)
      .join(" ");
    console.log(`${String(i + 1).padStart(2)}. ${c.id.padEnd(28)} ${marks}${row.detail ? `\n      ${row.detail}` : ""}`);
  }

  const scores = Object.fromEntries((Object.keys(LABELS) as Metric[]).map((m) => [m, score(rows, m)])) as Record<Metric, number | null>;

  // Comparaison avec la référence
  let baseline: Record<Metric, number | null> | null = null;
  try {
    baseline = JSON.parse(await readFile("eval/baseline.json", "utf8")).scores;
  } catch {
    // pas encore de référence
  }

  console.log("\nRésultats :");
  const regressions: string[] = [];
  for (const m of Object.keys(LABELS) as Metric[]) {
    if (scores[m] === null) continue;
    const ref = baseline?.[m];
    const diff = ref != null ? scores[m]! - ref : null;
    const diffText = diff === null ? "" : ` (référence ${ref} %, ${diff >= 0 ? "+" : ""}${diff})`;
    console.log(`  ${LABELS[m].padEnd(34)} ${String(scores[m]).padStart(3)} %${diffText}`);
    if (diff !== null && diff < -MAX_DROP) regressions.push(LABELS[m]);
  }

  const report = { date: new Date().toISOString(), mode: RETRIEVAL_ONLY ? "retrieval-only" : "full", scores, rows };
  await mkdir("eval/results", { recursive: true });
  await writeFile("eval/results/latest.json", JSON.stringify(report, null, 2));
  if (SAVE_BASELINE) {
    await writeFile("eval/baseline.json", JSON.stringify(report, null, 2));
    console.log("\nRéférence enregistrée dans eval/baseline.json");
  }

  if (regressions.length) {
    console.error(`\nRégression détectée (baisse de plus de ${MAX_DROP} points) : ${regressions.join(", ")}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
