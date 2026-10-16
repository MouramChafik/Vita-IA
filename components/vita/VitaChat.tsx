"use client";
// Conversation avec Vita. Utilisé dans le widget flottant ET sur la page /assistant.
// Ce composant tourne dans le navigateur : il appelle notre API /api/ask, jamais Gemini directement.

import { useEffect, useRef, useState, type FormEvent } from "react";

type Source = { n: number; title: string; page: number; excerpt: string };

type Message = {
  role: "user" | "vita";
  text: string;
  sources?: Source[];
  error?: boolean;
};

// Remplace les marqueurs [1], [2]... par de petites pastilles numérotées
function AnswerText({ text }: { text: string }) {
  const parts = text.split(/(\[\d+\])/g);
  return (
    <p className="whitespace-pre-wrap">
      {parts.map((part, i) => {
        const m = part.match(/^\[(\d+)\]$/);
        return m ? (
          <sup key={i} className="mx-0.5 rounded bg-teal-soft px-1 text-[10px] font-semibold text-teal">
            {m[1]}
          </sup>
        ) : (
          part
        );
      })}
    </p>
  );
}

// Liste des sources citées, chaque extrait se déplie au clic
function SourceList({ sources }: { sources: Source[] }) {
  return (
    <div className="mt-3 space-y-1.5 border-t border-line pt-3">
      <p className="text-xs font-medium text-muted">Sources</p>
      {sources.map((s) => (
        <details key={s.n} className="group rounded-lg bg-teal-soft/50 text-xs">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-2.5 py-1.5 font-medium text-teal">
            <span className="grid h-4 w-4 place-items-center rounded bg-teal text-[10px] text-white">{s.n}</span>
            {s.title}, page {s.page}
            <span className="ml-auto text-muted group-open:hidden">Voir l&apos;extrait</span>
          </summary>
          <p className="px-2.5 pb-2.5 leading-relaxed text-muted">{s.excerpt}</p>
        </details>
      ))}
    </div>
  );
}

export const SUGGESTIONS = [
  "Qu'est-ce qu'un ticket modérateur ?",
  "Combien pour des lunettes avec la formule Équilibre ?",
  "L'ostéopathe est-il remboursé ?",
];

type Props = {
  // Question envoyée depuis l'extérieur (ex. un bouton « Demander à Vita » sur la page)
  incomingQuestion?: { text: string; id: number } | null;
  compact?: boolean;
};

// La conversation est gardée dans le navigateur (localStorage) jusqu'à « Nouvelle discussion ».
// Même clé pour le widget et la page /assistant : on retrouve la même conversation partout.
const STORAGE_KEY = "vita:conversation";
const HISTORY_SENT = 6; // nombre de messages précédents envoyés à l'API pour comprendre les relances

function loadConversation(): Message[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as Message[]) : [];
  } catch {
    return []; // navigation privée, stockage bloqué...
  }
}

export default function VitaChat({ incomingQuestion, compact = false }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [restored, setRestored] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Au montage : on recharge la conversation enregistrée.
  // (Pas dans useState directement : le rendu serveur n'a pas accès à localStorage.)
  useEffect(() => {
    setMessages(loadConversation());
    setRestored(true);
  }, []);

  // À chaque changement : on enregistre
  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // stockage indisponible : la conversation reste en mémoire seulement
    }
  }, [messages, restored]);

  function newConversation() {
    setMessages([]);
    setInput("");
  }

  // Défiler vers le dernier message à chaque nouveauté
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function ask(text: string) {
    const question = text.trim();
    if (!question || loading) return;

    // Historique envoyé à l'API : les derniers échanges réussis, pour comprendre « et avec Sérénité ? »
    const history = messages
      .filter((m) => !m.error)
      .slice(-HISTORY_SENT)
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.geminiStatus === 503
            ? "Le service IA est très sollicité. Réessayez dans quelques secondes."
            : (data.error ?? "La réponse n'a pas pu être générée."),
        );
      }
      setMessages((prev) => [...prev, { role: "vita", text: data.answer, sources: data.sources }]);
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
              <AnswerText text={m.text} />
              {m.sources && m.sources.length > 0 && <SourceList sources={m.sources} />}
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

      {messages.length > 0 && (
        <div className={`flex justify-end ${compact ? "px-3 pb-2" : "pb-2"}`}>
          <button
            type="button"
            onClick={newConversation}
            disabled={loading}
            className="rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-muted hover:border-ink/30 hover:text-ink disabled:opacity-40"
          >
            Nouvelle discussion
          </button>
        </div>
      )}
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
