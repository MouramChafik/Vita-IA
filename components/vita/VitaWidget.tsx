"use client";
// Bouton flottant + panneau de conversation, présent sur toutes les pages.
// N'importe quel bouton du site peut ouvrir Vita avec une question grâce à askVita().

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import VitaChat from "./VitaChat";
import VitaLogo from "./VitaLogo";

const EVENT = "vita:ask";

// Fonction utilitaire : déclenche un événement navigateur que le widget écoute.
export function askVita(question?: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: question }));
}

export default function VitaWidget() {
  const [open, setOpen] = useState(false);
  const [incoming, setIncoming] = useState<{ text: string; id: number } | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    function onAsk(e: Event) {
      const question = (e as CustomEvent<string | undefined>).detail;
      setOpen(true);
      if (question) setIncoming({ text: question, id: Date.now() });
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener(EVENT, onAsk);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(EVENT, onAsk);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // Sur la page /assistant, la conversation est déjà affichée en plein écran
  if (pathname === "/assistant") return null;

  return (
    <>
      {open && (
        <section
          role="dialog"
          aria-label="Conversation avec Vita"
          className="fixed inset-x-3 bottom-20 z-50 flex h-[min(560px,75vh)] flex-col overflow-hidden rounded-3xl border border-line bg-paper shadow-[0_24px_60px_-20px_rgba(15,42,46,0.45)] sm:inset-x-auto sm:right-6 sm:w-[400px]"
        >
          <header className="flex items-center justify-between bg-ink px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <VitaLogo className="h-7 w-7" />
              <div>
                <p className="font-semibold leading-tight">Vita</p>
                <p className="text-xs text-white/60">Assistante de Vita Mutuelle</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-lg px-2 py-1 text-sm text-white/70 hover:bg-white/10 hover:text-white">
              Fermer
            </button>
          </header>
          <VitaChat incomingQuestion={incoming} compact />
        </section>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-vita py-2 pl-2 pr-4 font-semibold text-white shadow-lg shadow-vita/30 hover:brightness-110 sm:right-6"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M3 12h4l2-4 3 9 3-11 2 6h4" />
          </svg>
        </span>
        {open ? "Réduire" : "Demander à Vita"}
      </button>
    </>
  );
}
