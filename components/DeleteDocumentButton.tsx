"use client";
// Supprime un document publié depuis l'extraction : PDF, passages (Vita l'oublie) et garanties.
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteDocumentButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (!confirm(`Supprimer « ${title} » du site ? Vita ne pourra plus s'en servir.`)) return;
    setPending(true);
    setError(null);
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh(); // recharge la page avec le catalogue à jour
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "La suppression a échoué.");
      setPending(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className="rounded-full border border-coral px-4 py-2 text-sm font-semibold text-ink hover:bg-coral/20 disabled:opacity-50"
      >
        {pending ? "Suppression…" : "Supprimer"}
      </button>
      {error && <span className="mt-1 text-xs text-red-700">{error}</span>}
    </span>
  );
}
