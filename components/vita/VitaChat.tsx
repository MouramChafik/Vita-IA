"use client";
// Conversation avec Vita. Utilisé dans le widget flottant ET sur la page /assistant.
// Ce composant tourne dans le navigateur : il appelle notre API /api/ask, jamais Gemini directement.

import { useEffect, useRef, useState, type FormEvent } from "react";

type Message = {
  role: "user" | "vita";
  text: string;
  error?: boolean;
};

export const SUGGESTIONS = [
  "Qu'est-ce qu'un ticket modérateur ?",
  "Comment est remboursée une paire de lunettes ?",
  "Secteur 1 ou secteur 2 : quelle différence pour moi ?",
];

type Props = {
  // Question envoyée depuis l'extérieur (ex. un bouton « Demander à Vita » sur la page)
  incomingQuestion?: { text: string; id: number } | null;
  compact?: boolean;
};

export default function VitaChat({ incomingQuestion, compact = false }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Défiler vers le dernier message à chaque nouveauté
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function ask(text: string) {
    const question = text.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.geminiStatus === 503
            ? "Le service IA est très sollicité. Réessayez dans quelques secondes."
            : (data.error ?? "La réponse n'a pas pu être générée."),
        );
      }
      setMessages((prev) => [...prev, { role: "vita", text: data.answer }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "vita", text: (err as Error).message, error: true }]);
    } finally {
      setLoading(false);
    }
  }

  // Quand une question arrive de l'extérieur, on la pose (l'id change à chaque clic)
  useEffect(() => {
    if (incomingQuestion) ask(incomingQuestion.text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingQuestion?.id]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    ask(input);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={`flex-1 space-y-3 overflow-y-auto ${compact ? "p-4" : "py-6"}`} aria-live="polite">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Bonjour, je suis Vita. Posez-moi une question sur vos remboursements ou vos garanties.
            </p>
            <div className="flex flex-col items-start gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="rounded-lg border border-vita/20 bg-vita-soft/60 px-3 py-1.5 text-left text-sm text-vita hover:bg-vita-soft"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <p key={i} className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-sm text-white">
              {m.text}
            </p>
          ) : (
            <div
              key={i}
              className={`max-w-[92%] rounded-2xl rounded-bl-md border px-4 py-3 text-sm leading-relaxed ${
                m.error ? "border-coral bg-coral/15" : "border-line bg-white"
              }`}
            >
              <p className="mb-1 text-xs font-semibold text-vita">Vita</p>
              <p className="whitespace-pre-wrap">{m.text}</p>
            </div>
          ),
        )}

        {loading && (
          <div className="flex w-fit items-center gap-1.5 rounded-2xl border border-line bg-white px-4 py-3" aria-label="Vita rédige une réponse">
            <span className="wait-dot h-1.5 w-1.5 rounded-full bg-vita" />
            <span className="wait-dot h-1.5 w-1.5 rounded-full bg-vita" />
            <span className="wait-dot h-1.5 w-1.5 rounded-full bg-vita" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={onSubmit} className={`flex gap-2 border-t border-line bg-white ${compact ? "p-3" : "rounded-2xl border p-2"}`}>
        <label htmlFor={compact ? "vita-input-widget" : "vita-input"} className="sr-only">
          Votre question
        </label>
        <input
          id={compact ? "vita-input-widget" : "vita-input"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ex. : remboursement d'un dermatologue"
          className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted/70"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-vita px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          Envoyer
        </button>
      </form>
      <p className={`text-[11px] text-muted ${compact ? "px-3 pb-2" : "mt-2"}`}>
        Vita peut se tromper. Vérifiez toujours dans votre notice.
      </p>
    </div>
  );
}
