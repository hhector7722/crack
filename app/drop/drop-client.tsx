"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, Loader2, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type Drop = {
  id: string;
  content: string | null;
  file_url: string | null;
  user_id: string;
  created_at: string;
  expires_at: string;
};

function sortDrops(drops: Drop[]) {
  return [...drops].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

function formatRemaining(expiresAt: string, now: number) {
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return "Expirado";

  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.max(0, Math.floor((ms % 3_600_000) / 60_000));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const restHours = hours % 24;
    return `${days}d ${restHours}h`;
  }

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function getCopyValue(drop: Drop) {
  return drop.content?.trim() || drop.file_url || "";
}

export function DropClient({
  initialDrops,
  userId,
}: {
  initialDrops: Drop[];
  userId: string;
}) {
  const [drops, setDrops] = useState(() => sortDrops(initialDrops));
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    const updateNow = () => setNow(Date.now());
    const initialTimer = window.setTimeout(updateNow, 0);
    const timer = window.setInterval(updateNow, 60_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "default") {
      return;
    }

    void Notification.requestPermission();
  }, []);

  const upsertDrop = useCallback((drop: Drop) => {
    setDrops((current) => {
      const withoutDuplicate = current.filter((item) => item.id !== drop.id);
      return sortDrops([drop, ...withoutDuplicate]).filter(
        (item) => new Date(item.expires_at).getTime() > Date.now()
      );
    });
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`drops:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "drops",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const nextDrop = payload.new as Drop;
          upsertDrop(nextDrop);

          if (
            document.hidden &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            const body = getCopyValue(nextDrop).slice(0, 120) || "Nuevo archivo";
            new Notification("Nuevo Drop", { body });
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [upsertDrop, userId]);

  const visibleDrops = useMemo(
    () =>
      drops.filter((drop) => now === 0 || new Date(drop.expires_at).getTime() > now),
    [drops, now]
  );

  async function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setError(null);

    try {
      if ("Notification" in window && Notification.permission === "default") {
        void Notification.requestPermission();
      }

      const supabase = createClient();
      const { data, error: insertError } = await supabase
        .from("drops")
        .insert({
          content: trimmed,
          user_id: userId,
        })
        .select("id, content, file_url, user_id, created_at, expires_at")
        .single();

      if (insertError) throw insertError;
      upsertDrop(data as Drop);
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error enviando Drop");
    } finally {
      setSending(false);
    }
  }

  async function copyDrop(drop: Drop) {
    const value = getCopyValue(drop);
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(drop.id);
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch {
      setError("No se pudo copiar al portapapeles");
    }
  }

  return (
    <main className="min-h-dvh bg-zinc-950 px-4 py-8 text-zinc-100 safe-top">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-[420px] flex-col">
        <header className="shrink-0 pb-5">
          <p className="text-xs font-semibold uppercase tracking-normal text-zinc-500">
            Crack
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-normal">Drop</h1>
        </header>

        <form onSubmit={handleSend} className="shrink-0 border-b border-zinc-800 pb-5">
          <label htmlFor="drop-content" className="sr-only">
            Nuevo Drop
          </label>
          <textarea
            id="drop-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Soltar texto temporal..."
            rows={4}
            className="min-h-28 w-full resize-none rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-3 text-base text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-500"
          />
          <button
            type="submit"
            disabled={!content.trim() || sending}
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-zinc-100 text-sm font-semibold text-zinc-950 transition-colors hover:bg-white disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? "Enviando..." : "Enviar"}
          </button>
        </form>

        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

        <section className="flex-1 py-4">
          {visibleDrops.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-500">
              No hay Drops activos.
            </p>
          ) : (
            <div className="space-y-3">
              {visibleDrops.map((drop) => {
                const value = getCopyValue(drop);
                return (
                  <article
                    key={drop.id}
                    className="rounded-md border border-zinc-800 bg-zinc-900/35 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="line-clamp-2 min-w-0 flex-1 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-200">
                        {value}
                      </p>
                      <span className="shrink-0 font-mono text-xs text-zinc-500">
                        {now === 0 ? "--" : formatRemaining(drop.expires_at, now)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void copyDrop(drop)}
                      disabled={!value}
                      className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-md border border-zinc-700 text-sm font-semibold text-zinc-100 transition-colors active:border-zinc-500 disabled:opacity-50"
                    >
                      {copiedId === drop.id ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copiedId === drop.id ? "Copiado" : "Copiar"}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
