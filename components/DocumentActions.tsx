"use client";
// Actions sur un document publié depuis l'extraction : relancer l'extraction ou le supprimer.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { aiUnavailableMessage } from "@/lib/ai-status-message";

export default function DocumentActions({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<"extract" | "delete" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function reextract() {
    setPending("extract");
    setMessage(null);
    const res = await fetch(`/api/documents/${id}`, { method: "PATCH" });
    const data = await res.json().catch(() => ({}));
    setPending(null);
    if (res.ok) {
      setMessage(`${data.garanties} garanties extraites.`);
      router.refresh(); // recharge le tableau avec la nouvelle extraction
    } else {
      setMessage(aiUnavailableMessage({ ...data, fallback: data.error ?? "La réextraction a échoué." }));
    }
  }

  async function remove() {
    if (!confirm(`Supprimer « ${title} » du site ? Vita ne pourra plus s'en servir.`)) return;
    setPending("delete");
    setMessage(null);
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error ?? "La suppression a échoué.");
      setPending(null);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <span className="flex gap-2">
        <button
          type="button"
          onClick={reextract}
          disabled={pending !== null}
          className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold hover:border-ink/40 disabled:opacity-50"
        >
          {pending === "extract" ? "Extraction… (1 min max)" : "Réextraire"}
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={pending !== null}
          className="rounded-full border border-coral px-4 py-2 text-sm font-semibold hover:bg-coral/20 disabled:opacity-50"
        >
          {pending === "delete" ? "Suppression…" : "Supprimer"}
        </button>
      </span>
      {message && <span className="max-w-xs text-right text-xs text-muted">{message}</span>}
    </span>
  );
}
