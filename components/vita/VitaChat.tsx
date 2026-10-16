"use client";
// Conversation avec Vita. Utilisé dans le widget flottant ET sur la page /assistant.
// Ce composant tourne dans le navigateur : il appelle notre API /api/ask, jamais Gemini directement.
// La réponse arrive EN FLUX (NDJSON) : on l'affiche pendant qu'elle s'écrit.

import { useEffect, useRef, useState, type FormEvent } from "react";
import { aiUnavailableMessage } from "@/lib/ai-status-message";

type Source = { n: number; title: string; page: number; excerpt: string; url: string | null };

type Message = {
  role: "user" | "vita";
  text: string;
  at: string; // date ISO, pour afficher l'heure
  sources?: Source[];
  followups?: string[];
  logId?: number | null; // ligne de query_logs, pour le vote
  feedback?: 1 | -1 | null;
  status?: "search" | "write" | "done";
  error?: boolean;
};

export const SUGGESTIONS = [
  "Qu'est-ce qu'un ticket modérateur ?",
  "Combien pour des lunettes avec la formule Équilibre ?",
  "L'ostéopathe est-il remboursé ?",
];

// La conversation est gardée dans le navigateur (localStorage) jusqu'à « Nouvelle discussion ».
// Même clé pour le widget et la page /assistant : on retrouve la même conversation partout.
const STORAGE_KEY = "vita:conversation";
const HISTORY_SENT = 6; // nombre de messages précédents envoyés à l'API pour comprendre les relances

function loadConversation(): Message[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const messages = saved ? (JSON.parse(saved) as Message[]) : [];
    // Anciens messages sans heure, ou réponse interrompue (page fermée pendant l'écriture)
    return messages.map((m) => ({
      ...m,
      at: m.at ?? new Date().toISOString(),
      status: m.role === "vita" ? "done" : m.status,
    }));
  } catch {
    return []; // navigation privée, stockage bloqué...
  }
}

// Pendant le flux, la ligne "SUIVI: ..." arrive à la fin : on ne l'affiche pas
const hideFollowupLine = (text: string) => text.split(/\n?\s*SUIVI\s*:/)[0];

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

// ---------- Morceaux d'interface ----------

// Remplace les marqueurs [1], [2]... par des pastilles cliquables qui déplient la source
function AnswerText({ text, onCite }: { text: string; onCite: (n: number) => void }) {
  const parts = text.split(/(\[\d+\])/g);
  return (
    <p className="whitespace-pre-wrap">
      {parts.map((part, i) => {
        const m = part.match(/^\[(\d+)\]$/);
        return m ? (
          <button
            key={i}
            type="button"
            onClick={() => onCite(Number(m[1]))}
            aria-label={`Voir la source ${m[1]}`}
            className="mx-0.5 rounded bg-teal-soft px-1 align-super text-[10px] font-semibold leading-none text-teal hover:bg-teal hover:text-white"
          >
            {m[1]}
          </button>
        ) : (
          part
        );
      })}
    </p>
  );
}

// Sources citées : chaque extrait se déplie, avec un lien vers le PDF à la bonne page
function SourceList({ sources, openN, idPrefix }: { sources: Source[]; openN: number | null; idPrefix: string }) {
  return (
    <div className="mt-3 space-y-1.5 border-t border-line pt-3">
      <p className="text-xs font-medium text-muted">Sources</p>
      {sources.map((s) => (
        <details
          key={`${s.n}-${openN === s.n}`}
          id={`${idPrefix}-${s.n}`}
          open={openN === s.n}
          className="group rounded-lg bg-teal-soft/50 text-xs"
        >
          <summary className="flex cursor-pointer list-none items-center gap-2 px-2.5 py-1.5 font-medium text-teal">
            <span className="grid h-4 w-4 shrink-0 place-items-center rounded bg-teal text-[10px] text-white">{s.n}</span>
            {s.title}, page {s.page}
            <span className="ml-auto shrink-0 text-muted group-open:hidden">Voir l&apos;extrait</span>
          </summary>
          <p className="px-2.5 leading-relaxed text-muted">{s.excerpt}</p>
          {s.url && (
            <a
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="block px-2.5 pb-2.5 pt-1.5 font-semibold text-teal underline underline-offset-2"
            >
              Ouvrir le PDF à la page {s.page}
            </a>
          )}
        </details>
      ))}
    </div>
  );
}

function StatusLine({ status }: { status: "search" | "write" }) {
  return (
    <p className="flex items-center gap-2 text-xs text-muted">
      <span className="flex gap-1" aria-hidden="true">
        <span className="wait-dot h-1.5 w-1.5 rounded-full bg-vita" />
        <span className="wait-dot h-1.5 w-1.5 rounded-full bg-vita" />
        <span className="wait-dot h-1.5 w-1.5 rounded-full bg-vita" />
      </span>
      {status === "search" ? "Vita cherche dans les documents…" : "Vita rédige sa réponse…"}
    </p>
  );
}

function IconButton(props: { label: string; active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      aria-label={props.label}
      aria-pressed={props.active}
      title={props.label}
      className={`grid h-7 w-7 place-items-center rounded-md transition ${
        props.active ? "bg-vita-soft text-vita" : "text-muted hover:bg-paper hover:text-ink"
      }`}
    >
      {props.children}
    </button>
  );
}

// ---------- Composant principal ----------

type Props = {
  // Question envoyée depuis l'extérieur (ex. un bouton « Demander à Vita » sur la page)
  incomingQuestion?: { text: string; id: number } | null;
  compact?: boolean;
};

export default function VitaChat({ incomingQuestion, compact = false }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [restored, setRestored] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [openSource, setOpenSource] = useState<{ msg: number; n: number } | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const idPrefix = compact ? "w" : "p"; // ids distincts pour le widget et la page

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

  // Défiler vers le bas quand un message arrive ou grandit
  const lastText = messages[messages.length - 1]?.text;
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, lastText]);

  // Met à jour la dernière réponse de Vita (celle en cours d'écriture)
  function updateLast(patch: (m: Message) => Partial<Message>) {
    setMessages((prev) => {
      const next = [...prev];
      next[next.length - 1] = { ...next[next.length - 1], ...patch(next[next.length - 1]) };
      return next;
    });
  }

  async function ask(text: string) {
    const question = text.trim();
    if (!question || loading) return;

    // Historique envoyé à l'API : les derniers échanges réussis, pour comprendre « et avec Sérénité ? »
    const history = messages
      .filter((m) => !m.error && m.text)
      .slice(-HISTORY_SENT)
      .map((m) => ({ role: m.role, text: m.text }));

    const now = new Date().toISOString();
    setMessages((prev) => [
      ...prev,
      { role: "user", text: question, at: now },
      { role: "vita", text: "", at: now, status: "search" },
    ]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "La réponse n'a pas pu être générée.");
      }

      // Lecture du flux : une ligne = un événement JSON
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? ""; // la dernière ligne peut être incomplète
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);
          if (event.type === "status") updateLast(() => ({ status: event.step }));
          if (event.type === "delta") updateLast((m) => ({ text: m.text + event.text }));
          if (event.type === "done") {
            updateLast(() => ({
              text: event.answer,
              sources: event.sources,
              followups: event.followups,
              logId: event.logId,
              at: new Date().toISOString(),
              status: "done",
            }));
          }
          if (event.type === "error") {
            throw new Error(
              aiUnavailableMessage({
                geminiStatus: event.geminiStatus,
                retryAfterSeconds: event.retryAfterSeconds,
                fallback: event.error,
              }),
            );
          }
        }
      }
    } catch (err) {
      updateLast(() => ({ text: (err as Error).message, error: true, status: "done", sources: [], followups: [] }));
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

  function newConversation() {
    setMessages([]);
    setInput("");
    setOpenSource(null);
  }

  // Clic sur une pastille [n] : déplie la source et la fait défiler à l'écran
  function showSource(msg: number, n: number) {
    setOpenSource({ msg, n });
    requestAnimationFrame(() =>
      document.getElementById(`${idPrefix}-${msg}-${n}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
    );
  }

  async function copy(i: number, text: string) {
    try {
      await navigator.clipboard.writeText(text.replace(/\s*\[\d+\]/g, ""));
      setCopied(i);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // presse-papiers refusé : rien à faire
    }
  }

  async function vote(i: number, value: 1 | -1) {
    const m = messages[i];
    if (!m.logId) return;
    const next = m.feedback === value ? null : value; // recliquer annule le vote
    setMessages((prev) => prev.map((msg, j) => (j === i ? { ...msg, feedback: next } : msg)));
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logId: m.logId, value: next }),
    }).catch(() => undefined);
  }

  const last = messages.length - 1;

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
            <div key={i} className="ml-auto w-fit max-w-[85%]">
              <p className="rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-sm text-white">{m.text}</p>
              <p className="mt-1 text-right text-[10px] text-muted">{timeOf(m.at)}</p>
            </div>
          ) : (
            <div key={i} className="max-w-[92%]">
              <div
                className={`rounded-2xl rounded-bl-md border px-4 py-3 text-sm leading-relaxed ${
                  m.error ? "border-coral bg-coral/15" : "border-line bg-white"
                }`}
              >
                <p className="mb-1 text-xs font-semibold text-vita">Vita</p>
                {m.text ? (
                  <AnswerText text={hideFollowupLine(m.text)} onCite={(n) => showSource(i, n)} />
                ) : (
                  m.status && m.status !== "done" && <StatusLine status={m.status} />
                )}
                {m.sources && m.sources.length > 0 && (
                  <SourceList
                    sources={m.sources}
                    openN={openSource?.msg === i ? openSource.n : null}
                    idPrefix={`${idPrefix}-${i}`}
                  />
                )}
              </div>

              {/* Barre d'actions sous une réponse terminée */}
              {m.status === "done" && !m.error && m.text && (
                <div className="mt-1 flex items-center gap-0.5">
                  <span className="mr-1 text-[10px] text-muted">{timeOf(m.at)}</span>
                  <IconButton label={copied === i ? "Copié" : "Copier la réponse"} onClick={() => copy(i, m.text)}>
                    {copied === i ? (
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="m3 8 3 3 7-7" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                        <rect x="5" y="5" width="8" height="9" rx="1.5" />
                        <path d="M3 11V3.5A1.5 1.5 0 0 1 4.5 2H10" />
                      </svg>
                    )}
                  </IconButton>
                  {m.logId && (
                    <>
                      <IconButton label="Réponse utile" active={m.feedback === 1} onClick={() => vote(i, 1)}>
                        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
                          <path d="M5 7v7H2.5V7zM5 7l3-5c1.2 0 2 .8 2 2v2h3.2a1.3 1.3 0 0 1 1.3 1.5l-.9 5A1.5 1.5 0 0 1 12.1 14H5" />
                        </svg>
                      </IconButton>
                      <IconButton label="Réponse pas utile" active={m.feedback === -1} onClick={() => vote(i, -1)}>
                        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
                          <path d="M5 9V2H2.5v7zM5 9l3 5c1.2 0 2-.8 2-2v-2h3.2a1.3 1.3 0 0 0 1.3-1.5l-.9-5A1.5 1.5 0 0 0 12.1 2H5" />
                        </svg>
                      </IconButton>
                    </>
                  )}
                </div>
              )}

              {/* Questions de relance, seulement sous la dernière réponse */}
              {i === last && !loading && m.followups && m.followups.length > 0 && (
                <div className="mt-2 flex flex-col items-start gap-1.5">
                  {m.followups.map((q) => (
                    <button
                      key={q}
                      onClick={() => ask(q)}
                      className="rounded-lg border border-vita/20 bg-vita-soft/60 px-3 py-1.5 text-left text-xs text-vita hover:bg-vita-soft"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ),
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
