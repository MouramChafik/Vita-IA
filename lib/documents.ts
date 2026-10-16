// Fichiers PDF publics des documents indexés (servis depuis public/documents).
// Permet d'ouvrir une source citée directement à la bonne page : /documents/x.pdf#page=3
export const DOCUMENT_FILES: Record<string, string> = {
  "Notice d'information 2026": "/documents/vita-notice-2026.pdf",
  "Tableau des garanties 2026": "/documents/vita-tableau-garanties-2026.pdf",
  "Guide du 100 % Santé": "/documents/vita-guide-100-sante.pdf",
};

export function documentUrl(title: string, page: number): string | null {
  const file = DOCUMENT_FILES[title];
  return file ? `${file}#page=${page}` : null;
}
