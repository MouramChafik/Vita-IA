"use client";
// Petit bouton réutilisable : ouvre le widget Vita et pose directement la question.
import { askVita } from "./VitaWidget";

export default function AskVitaButton({
  question,
  children,
  className = "",
}: {
  question?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button type="button" onClick={() => askVita(question)} className={className}>
      {children}
    </button>
  );
}
