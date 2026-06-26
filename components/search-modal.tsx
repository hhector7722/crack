"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, FileText, Mic, Image as ImageIcon, Link2, Loader2, Command } from "lucide-react";
import { createPortal } from "react-dom";
import { useModalOpen } from "@/lib/ui/use-modal-open";
import { cn, getNoteUrl } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { SearchResultItem, SearchSource } from "@/lib/types";

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: SearchResultItem) => void;
}

function TypeIcon({ type, item }: { type: string; item: SearchResultItem }) {
  if (type === "audio") return <Mic className="h-4 w-4 text-zinc-400" />;
  if (type === "image") return <ImageIcon className="h-4 w-4 text-zinc-400" />;
  if (getNoteUrl(item)) return <Link2 className="h-4 w-4 text-zinc-400" />;
  return <FileText className="h-4 w-4 text-zinc-400" />;
}

export function SearchModal({ open, onOpenChange, onSelect }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchSource, setSearchSource] = useState<SearchSource>("fts");
  const [hasSemantic, setHasSemantic] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const semanticRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useModalOpen(open);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setHasSemantic(false);
      setSearchSource("fts");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  function logSearchEvent(payload: {
    query: string;
    item_id?: string;
    position?: number;
    clicked?: boolean;
  }) {
    fetch("/api/search-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }

  const doSearch = useCallback(async (q: string, semantic: boolean) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: q.trim() });
      if (semantic) params.set("semantic", "true");
      const res = await fetch(`/api/search?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      if (semantic) {
        setHasSemantic(true);
      }
      setResults(data.results ?? []);
      setSearchSource(data.search_source ?? "fts");
      setSelectedIndex(0);
      if (!semantic) {
        logSearchEvent({ query: q.trim() });
      }
    } catch {
      // FTS still works even if semantic fails
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    setHasSemantic(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (semanticRef.current) clearTimeout(semanticRef.current);

    debounceRef.current = setTimeout(() => {
      doSearch(value, false);
      semanticRef.current = setTimeout(() => {
        doSearch(value, true);
      }, 400);
    }, 200);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      const item = results[selectedIndex];
      logSearchEvent({ query, item_id: item.id, position: selectedIndex + 1, clicked: true });
      onSelect(item);
      onOpenChange(false);
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  }

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (semanticRef.current) clearTimeout(semanticRef.current);
    };
  }, []);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-start justify-center bg-black/40 backdrop-blur-sm pt-[15vh]"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="relative z-10 w-full max-w-[min(580px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-zinc-800 px-4">
          <Search className="h-5 w-5 shrink-0 text-zinc-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Buscar en Crack..."
            className="h-14 w-full bg-transparent text-lg text-zinc-100 placeholder-zinc-600 outline-none"
            autoFocus
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />}
        </div>

        {results.length > 0 && (
          <div className="flex items-center gap-2 border-b border-zinc-800/50 px-4 py-1.5">
            <span className="text-xs text-zinc-600">
              {results.length} resultado{results.length !== 1 ? "s" : ""}
            </span>
            {hasSemantic && (
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                semántico
              </span>
            )}
            {!hasSemantic && query.trim() && (
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-amber-400">
                solo texto
              </span>
            )}
          </div>
        )}

        {query.trim() && !loading && results.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-zinc-500">
            <Search className="h-8 w-8" />
            <p className="text-sm">Sin resultados para &ldquo;{query}&rdquo;</p>
          </div>
        )}

        {results.length > 0 && (
          <div
            ref={listRef}
            className="max-h-[min(60dvh,400px)] overflow-y-auto overscroll-contain"
          >
            {results.map((item, i) => (
              <button
                key={item.id}
                type="button"
                data-index={i}
                className={cn(
                  "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                  i === selectedIndex
                    ? "bg-zinc-800/80"
                    : "hover:bg-zinc-800/40"
                )}
                onClick={() => {
                  logSearchEvent({ query, item_id: item.id, position: i + 1, clicked: true });
                  onSelect(item);
                  onOpenChange(false);
                }}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <TypeIcon type={item.type} item={item} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-zinc-100">
                      {item.title || "Sin título"}
                    </span>
                    {item.pinned && (
                      <span className="shrink-0 text-[10px] text-amber-400">📌</span>
                    )}
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">
                    {item.metadata?.summary || item.content || ""}
                  </p>
                  <p className="mt-0.5 text-[10px] text-zinc-600">
                    {format(new Date(item.created_at), "d MMM", { locale: es })}
                  </p>
                </div>
                {i === selectedIndex && (
                  <kbd className="hidden shrink-0 items-center gap-0.5 rounded-md border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400 sm:flex">
                    ⏎
                  </kbd>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="hidden border-t border-zinc-800/50 px-4 py-2 sm:flex items-center justify-between text-[11px] text-zinc-600">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono">↑</kbd>
              <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono">↓</kbd>
              navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono">⏎</kbd>
              abrir
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono">Esc</kbd>
              cerrar
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="flex items-center gap-0.5 rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono">
              <Command className="h-3 w-3" />K
            </kbd>
            abrir búsqueda
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
