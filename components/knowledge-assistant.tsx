"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Loader2, SearchCheck, Sparkles } from "lucide-react";
import type { SearchResultItem } from "@/lib/types";

type AnswerSource = { number: number; item: SearchResultItem; url: string | null };
type AnswerResponse = {
  answer?: string;
  error?: string;
  sources?: AnswerSource[];
  mode?: string;
};

export function KnowledgeAssistant({
  query,
  onSelect,
}: {
  query: string;
  onSelect: (item: SearchResultItem) => void;
}) {
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<AnswerSource[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [indexed, setIndexed] = useState<number | null>(null);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    controller.current?.abort();
    setAnswer(null);
    setSources([]);
    setError(null);
    setAsking(false);
  }, [query]);

  useEffect(() => () => controller.current?.abort(), []);

  async function ask() {
    if (query.trim().length < 3 || asking) return;
    controller.current?.abort();
    const next = new AbortController();
    controller.current = next;
    setError(null);
    setAnswer(null);
    setSources([]);
    setAsking(true);
    try {
      const response = await fetch("/api/knowledge/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query.trim() }),
        signal: next.signal,
      });
      const data = await response.json() as AnswerResponse;
      if (!next.signal.aborted) {
        setSources(data.sources ?? []);
        if (!response.ok) setError(data.error ?? "No se ha podido consultar la biblioteca.");
        else setAnswer(data.answer ?? "Sin respuesta.");
      }
    } catch (err) {
      if (!next.signal.aborted) setError("No se ha podido conectar con el asistente.");
    } finally {
      if (!next.signal.aborted) setAsking(false);
    }
  }

  async function indexLibrary() {
    if (indexing) return;
    setIndexing(true);
    setIndexed(0);
    setError(null);
    let total = 0;
    try {
      for (let batch = 0; batch < 15; batch++) {
        const response = await fetch("/api/backfill", { method: "POST" });
        const data = await response.json() as {
          indexed?: number; has_more?: boolean; error?: string;
        };
        if (!response.ok || data.error) {
          setError(data.error ?? "No se pudo indexar la biblioteca.");
          break;
        }
        total += data.indexed ?? 0;
        setIndexed(total);
        if (!data.has_more) break;
      }
    } catch {
      setError("Error de conexión durante la indexación.");
    } finally {
      setIndexing(false);
    }
  }

  return (
    <div className="border-b border-zinc-800/60 px-4 py-3">
      {query.trim().length >= 3 ? (
        <button
          type="button"
          disabled={asking}
          onClick={ask}
          className="flex w-full min-h-11 items-center justify-center gap-2 rounded-xl bg-zinc-100 px-4 text-sm font-medium text-zinc-950 transition-colors active:bg-zinc-300 disabled:opacity-60"
        >
          {asking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {asking ? "Consultando tu biblioteca…" : "Preguntar a mi biblioteca"}
        </button>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-zinc-500">Busca enlaces o pregunta a tu memoria.</span>
          <button
            type="button"
            disabled={indexing}
            onClick={indexLibrary}
            className="flex shrink-0 items-center gap-1.5 text-xs text-zinc-400 underline-offset-2 hover:underline disabled:opacity-50"
          >
            {indexing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <SearchCheck className="h-3.5 w-3.5" />}
            {indexing ? "Indexando…" : "Indexar"}
          </button>
        </div>
      )}
      {indexed !== null && !indexing && (
        <p className="mt-2 text-xs text-zinc-500">{indexed} elementos indexados en esta operación.</p>
      )}
      {error && <p role="alert" className="mt-3 text-sm leading-relaxed text-amber-300">{error}</p>}
      {answer && (
        <div className="mt-3 space-y-3">
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-200">{answer}</p>
          {sources.length > 0 && (
            <div className="space-y-1">
              <p className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                <BookOpen className="h-3.5 w-3.5" /> Fuentes de tu biblioteca
              </p>
              {sources.map(source => (
                <button
                  key={source.item.id}
                  type="button"
                  onClick={() => onSelect(source.item)}
                  className="flex w-full min-h-10 items-center gap-2 rounded-lg px-2 text-left text-xs text-zinc-300 hover:bg-zinc-800"
                >
                  <span className="shrink-0 text-zinc-500">[{source.number}]</span>
                  <span className="min-w-0 truncate">{source.item.title || source.url || "Elemento guardado"}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
