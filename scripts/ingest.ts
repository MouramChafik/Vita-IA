// Indexe un PDF dans Supabase.
// Usage : npm run ingest -- data/vita-notice-2026.pdf "Notice d'information 2026"

import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { ingestPdf } from "../lib/ingest";

async function main() {
  const [path, title] = process.argv.slice(2);
  if (!path || !title) {
    console.error('Usage : npm run ingest -- <fichier.pdf> "<titre du document>"');
    process.exit(1);
  }

  const start = Date.now();
  const pdf = new Uint8Array(await readFile(path));
  const result = await ingestPdf({ pdf, fileName: basename(path), title });
  console.log(`OK : ${result.pages} pages, ${result.chunks} passages indexés en ${Date.now() - start} ms`);
}

main().catch((err) => {
  console.error("Échec de l'ingestion :", err.message ?? err);
  process.exit(1);
});
