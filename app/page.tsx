"use client";
// "use client" : ce composant tourne dans le navigateur (il a de l'état et des clics).
// Il n'a PAS accès à la clé Gemini : il appelle seulement notre API /api/ask.

import { useState, type FormEvent } from "react";

type Message = {
  role: "user" | "assistant";
  text: string;
  tokens?: number; // tokens consommés, renvoyés par l'API (usageMetadata)
  error?: boolean;
};

const EXEMPLES = [
  "Qu'est-ce qu'un ticket modérateur ?",
  "Comment fonctionne le remboursement de l'optique ?",
  "Quelle différence entre secteur 1 et secteur 2 ?",
];

export default function Home() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur inconnue");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.answer, tokens: data.usage?.totalTokenCount },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: (err as Error).message, error: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    ask(question);
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#05070d] text-slate-100">
      {/* Décor : grille + halos de couleur floutés */}
      <div className="bg-grid pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-80 w-80 rounded-full bg-purple-600/20 blur-3xl" />

      {/* En-tête */}
      <header className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 font-mono text-sm font-bold text-black">
            AI
          </div>
          <div>
            <p className="font-semibold tracking-wide">Assistant RAG Santé</p>
            <p className="font-mono text-[11px] text-cyan-300/70">gemini-2.5-flash · RAG v0.1</p>
          </div>
        </div>
        <span className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 font-mono text-xs text-emerald-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          en ligne
        </span>
      </header>

      {/* Zone principale */}
      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-6">
        {messages.length === 0 ? (
          <section className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-cyan-300/80">
              Intelligence artificielle · Assurance santé
            </p>
            <h1 className="bg-gradient-to-r from-cyan-300 via-sky-200 to-purple-300 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
              Posez votre question
            </h1>
            <p className="mt-4 max-w-md text-sm text-slate-400">
              L&apos;assistant lit les notices et tableaux de garanties, puis répond en citant ses sources.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {EXEMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => ask(ex)}
                  className="rounded-full border border-cyan-400/20 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400/60 hover:text-cyan-200"
                >
                  {ex}
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section className="flex flex-1 flex-col gap-4 py-6">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-cyan-500/15 px-4 py-3 text-cyan-50 ring-1 ring-cyan-400/30">
                  {m.text}
                </div>
              ) : (
                <div key={i} className={`glow-border max-w-[90%] rounded-2xl rounded-bl-sm px-4 py-3 ${m.error ? "text-red-300" : ""}`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                  {m.tokens && (
                    <p className="mt-2 font-mono text-[11px] text-slate-500">{m.tokens} tokens</p>
                  )}
                </div>
              ),
            )}
            {loading && (
              <div className="glow-border flex w-fit items-center gap-2 rounded-2xl px-4 py-3">
                <span className="font-mono text-xs text-cyan-300">analyse</span>
                <span className="dot h-1.5 w-1.5 rounded-full bg-cyan-300" />
                <span className="dot h-1.5 w-1.5 rounded-full bg-cyan-300" />
                <span className="dot h-1.5 w-1.5 rounded-full bg-cyan-300" />
              </div>
            )}
          </section>
        )}

        {/* Champ de saisie */}
        <form onSubmit={onSubmit} className="glow-border sticky bottom-4 flex items-center gap-2 rounded-2xl p-2 shadow-[0_0_40px_rgba(34,211,238,0.15)]">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ex. : remboursement d'une consultation chez un spécialiste ?"
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-40"
          >
            Envoyer
          </button>
        </form>
      </main>
    </div>
  );
}
