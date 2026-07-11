"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  File,
  ImageIcon,
  Loader2,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSignedUrl, uploadFile } from "@/lib/storage";

export type ContentType = "text" | "image" | "audio" | "video" | "file";

export type Drop = {
  id: string;
  content: string | null;
  file_url: string | null;
  content_type: ContentType;
  user_id: string;
  created_at: string;
  expires_at: string;
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function sortDropsAsc(drops: Drop[]) {
  return [...drops].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

function formatRemaining(expiresAt: string, now: number) {
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return "Exp.";

  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.max(0, Math.floor((ms % 3_600_000) / 60_000));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function mimeFromExt(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    wav: "audio/wav",
    ogg: "audio/ogg",
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
  };
  return map[ext] ?? "application/octet-stream";
}

function contentTypeFromFile(file: File): ContentType {
  const mime = file.type || mimeFromExt(file.name);
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  return "file";
}

function fileLabel(path: string) {
  return path.split("/").pop() ?? path;
}

// ─── signed-url cache ─────────────────────────────────────────────────────────

const signedCache = new Map<string, string>();

async function getOrFetchSignedUrl(path: string): Promise<string> {
  const cached = signedCache.get(path);
  if (cached) return cached;

  const supabase = createClient();
  const url = await getSignedUrl(supabase, path, 3600);
  signedCache.set(path, url);
  return url;
}

// ─── bubble content renderers ────────────────────────────────────────────────

function BubbleImage({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getOrFetchSignedUrl(path).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!url)
    return (
      <div className="flex h-40 w-56 items-center justify-center rounded-lg bg-zinc-800">
        <ImageIcon className="h-6 w-6 text-zinc-500" />
      </div>
    );

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt="Drop imagen"
      className="max-h-64 max-w-[14rem] rounded-lg object-cover"
      loading="lazy"
    />
  );
}

function BubbleAudio({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getOrFetchSignedUrl(path).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!url)
    return <div className="h-10 w-52 animate-pulse rounded-full bg-zinc-800" />;

  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <audio controls src={url} className="w-52 accent-violet-500" />
  );
}

function BubbleVideo({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getOrFetchSignedUrl(path).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!url)
    return (
      <div className="flex h-40 w-56 items-center justify-center rounded-lg bg-zinc-800">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
      </div>
    );

  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video
      controls
      src={url}
      className="max-h-64 max-w-[14rem] rounded-lg"
      playsInline
    />
  );
}

function BubbleFile({
  path,
  onCopy,
  copied,
}: {
  path: string;
  onCopy: () => void;
  copied: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const name = fileLabel(path);

  useEffect(() => {
    let cancelled = false;
    void getOrFetchSignedUrl(path).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <File className="h-5 w-5 shrink-0 text-violet-400" />
        <span className="max-w-[10rem] truncate text-sm text-zinc-200">{name}</span>
      </div>
      <div className="flex gap-2">
        {url ? (
          <a
            href={url}
            download={name}
            className="flex h-8 items-center gap-1.5 rounded-md bg-zinc-700 px-3 text-xs font-semibold text-zinc-100 transition-colors hover:bg-zinc-600"
          >
            <Download className="h-3.5 w-3.5" />
            Descargar
          </a>
        ) : null}
        <button
          type="button"
          onClick={onCopy}
          className="flex h-8 items-center gap-1.5 rounded-md bg-zinc-700 px-3 text-xs font-semibold text-zinc-100 transition-colors hover:bg-zinc-600"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <ExternalLink className="h-3.5 w-3.5" />
          )}
          {copied ? "Copiado" : "Copiar enlace"}
        </button>
      </div>
    </div>
  );
}

// ─── image expanded overlay ────────────────────────────────────────────────────

function ImageExpandedOverlay({
  path,
  onClose,
}: {
  path: string;
  onClose: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getOrFetchSignedUrl(path).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
      >
        <X className="h-5 w-5" />
      </button>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="Drop imagen ampliada"
          className="max-h-full max-w-full rounded-lg object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      )}
    </div>
  );
}

// ─── single bubble ────────────────────────────────────────────────────────────

function DropBubble({
  drop,
  now,
  onExpandImage,
}: {
  drop: Drop;
  now: number;
  onExpandImage: (path: string) => void;
}) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  async function copyText() {
    const value = drop.content?.trim() ?? "";
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedText(true);
      window.setTimeout(() => setCopiedText(false), 1600);
    } catch {
      /* ignore */
    }
  }

  async function copyFileUrl() {
    if (!drop.file_url) return;
    try {
      const url = await getOrFetchSignedUrl(drop.file_url);
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      window.setTimeout(() => setCopiedUrl(false), 1600);
    } catch {
      /* ignore */
    }
  }

  const remainingLabel =
    now === 0 ? "--" : formatRemaining(drop.expires_at, now);

  return (
    <div className="flex justify-end">
      <div className="relative flex max-w-[80%] flex-col gap-1.5">
        {/* bubble */}
        <div className="rounded-2xl rounded-br-sm bg-violet-600/20 px-3.5 py-2.5 ring-1 ring-inset ring-violet-500/30">
          {drop.content_type === "text" && drop.content ? (
            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-zinc-100">
              {drop.content}
            </p>
          ) : null}

          {drop.content_type === "image" && drop.file_url ? (
            <button type="button" onClick={() => onExpandImage(drop.file_url!)} className="block">
              <BubbleImage path={drop.file_url} />
            </button>
          ) : null}

          {drop.content_type === "audio" && drop.file_url ? (
            <BubbleAudio path={drop.file_url} />
          ) : null}

          {drop.content_type === "video" && drop.file_url ? (
            <BubbleVideo path={drop.file_url} />
          ) : null}

          {drop.content_type === "file" && drop.file_url ? (
            <BubbleFile
              path={drop.file_url}
              onCopy={copyFileUrl}
              copied={copiedUrl}
            />
          ) : null}
        </div>

        {/* meta row */}
        <div className="flex items-center justify-end gap-2 px-1">
          <span className="font-mono text-[10px] text-zinc-500">
            {remainingLabel}
          </span>

          {drop.content_type === "text" && drop.content ? (
            <button
              type="button"
              onClick={copyText}
              aria-label="Copiar texto"
              className="flex h-5 w-5 items-center justify-center rounded text-zinc-500 transition-colors hover:text-zinc-300"
            >
              {copiedText ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export function DropClient({
  initialDrops,
  userId,
}: {
  initialDrops: Drop[];
  userId: string;
}) {
  const [drops, setDrops] = useState<Drop[]>(() => sortDropsAsc(initialDrops));
  const [content, setContent] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [now, setNow] = useState(0);
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // clock tick
  useEffect(() => {
    const update = () => setNow(Date.now());
    const t0 = window.setTimeout(update, 0);
    const t1 = window.setInterval(update, 60_000);
    return () => {
      window.clearTimeout(t0);
      window.clearInterval(t1);
    };
  }, []);

  // notification permission
  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "default")
      return;
    void Notification.requestPermission();
  }, []);

  const upsertDrop = useCallback((drop: Drop) => {
    setDrops((current) => {
      const without = current.filter((d) => d.id !== drop.id);
      return sortDropsAsc([drop, ...without]).filter(
        (d) => new Date(d.expires_at).getTime() > Date.now()
      );
    });
  }, []);

  // ── realtime (diagnóstico) ─────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    const wsUrl = supabase.realtime?.getApi()?.getWebSocket?.()?.url ?? "unknown";
    console.log("[RT-DIAG] Creating channel drops:" + userId);
    console.log("[RT-DIAG] Supabase URL:", supabase.supabaseUrl);
    console.log("[RT-DIAG] WS URL approx:", wsUrl);

    const channel = supabase
      .channel(`drops:${userId}`)
      .on("postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "drops",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("[RT-DIAG] ✅ INSERT event received!", payload);
          console.log("[RT-DIAG] Payload new:", payload.new);
          const nextDrop = payload.new as Drop;
          upsertDrop(nextDrop);

          if (
            document.hidden &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            const body =
              nextDrop.content?.slice(0, 120) ??
              (nextDrop.file_url ? "Nuevo archivo" : "Nuevo Drop");
            new Notification("Nuevo Drop", { body });
          }
        }
      )
      .subscribe((status: string, err: Error | undefined) => {
        console.log("[RT-DIAG] Channel status:", status, err ?? "");
        if (err) console.error("[RT-DIAG] Channel error:", err);
      });

    // Verificar estado de conexión del websocket periódicamente
    const checkInterval = setInterval(() => {
      const socket = supabase.realtime?.getApi()?.getWebSocket();
      console.log("[RT-DIAG] WS state:", socket?.readyState === 1 ? "OPEN" : socket?.readyState === 0 ? "CONNECTING" : socket?.readyState === 2 ? "CLOSING" : socket?.readyState === 3 ? "CLOSED" : "UNKNOWN", "(readyState:", socket?.readyState, ")");
      console.log("[RT-DIAG] Channel state:", channel.state);
    }, 5000);

    return () => {
      console.log("[RT-DIAG] Cleaning up channel drops:" + userId);
      clearInterval(checkInterval);
      void supabase.removeChannel(channel);
    };
  }, [upsertDrop, userId]);

  // auto-scroll al último mensaje
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [drops]);

  const visibleDrops = useMemo(
    () =>
      drops.filter(
        (d) => now === 0 || new Date(d.expires_at).getTime() > now
      ),
    [drops, now]
  );

  // auto-resize textarea
  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPendingFile(file);
    // clear so same file can be re-selected
    e.target.value = "";
  }

  function removePendingFile() {
    setPendingFile(null);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if ((!trimmed && !pendingFile) || sending) return;

    setSending(true);
    setError(null);

    try {
      if ("Notification" in window && Notification.permission === "default") {
        void Notification.requestPermission();
      }

      if (pendingFile) {
        // Upload directo con el cliente de sesión — sin pasar por /api/drop
        // que solo acepta Bearer token (para el Shortcut de iOS).
        const ct = contentTypeFromFile(pendingFile);
        const ext = pendingFile.name.split(".").pop()?.toLowerCase() ?? "bin";
        const supabase = createClient();

        const filePath = await uploadFile(supabase, userId, "drops", pendingFile, ext);

        const { data, error: insertError } = await supabase
          .from("drops")
          .insert({
            file_url: filePath,
            content_type: ct,
            content: trimmed || null,
            user_id: userId,
          })
          .select(
            "id, content, file_url, content_type, user_id, created_at, expires_at"
          )
          .single();

        if (insertError) throw insertError;
        upsertDrop(data as Drop);
        setPendingFile(null);
      } else {
        // plain text via supabase client (same as before)
        const supabase = createClient();
        const { data, error: insertError } = await supabase
          .from("drops")
          .insert({
            content: trimmed,
            content_type: "text",
            user_id: userId,
          })
          .select(
            "id, content, file_url, content_type, user_id, created_at, expires_at"
          )
          .single();

        if (insertError) throw insertError;
        upsertDrop(data as Drop);
      }

      setContent("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error enviando Drop");
    } finally {
      setSending(false);
    }
  }

  const canSend = (content.trim().length > 0 || pendingFile !== null) && !sending;

  return (
    <div
      className="fixed inset-0 flex flex-col bg-zinc-950 text-zinc-100"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* ── header ── */}
      <header className="shrink-0 border-b border-zinc-800/60 px-4 pb-3 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          Crack
        </p>
        <h1 className="mt-0.5 text-lg font-bold">Drop</h1>
      </header>

      {/* ── messages scroll area ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain px-4 py-4"
      >
        {visibleDrops.length === 0 ? (
          <p className="mt-16 text-center text-sm text-zinc-500">
            No hay Drops activos.
            <br />
            <span className="text-xs">Todo expira en 48 h.</span>
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleDrops.map((drop) => (
              <DropBubble key={drop.id} drop={drop} now={now} onExpandImage={setExpandedImageUrl} />
            ))}
          </div>
        )}
      </div>

      {/* ── error banner ── */}
      {error ? (
        <p className="shrink-0 px-4 py-1 text-center text-xs text-red-400">
          {error}
        </p>
      ) : null}

      {/* ── pending file chip ── */}
      {pendingFile ? (
        <div className="shrink-0 flex items-center gap-2 border-t border-zinc-800/60 bg-zinc-900/60 px-4 py-2">
          <File className="h-4 w-4 shrink-0 text-violet-400" />
          <span className="min-w-0 flex-1 truncate text-xs text-zinc-300">
            {pendingFile.name}
          </span>
          <button
            type="button"
            onClick={removePendingFile}
            aria-label="Quitar archivo"
            className="shrink-0 text-xs text-zinc-500 hover:text-zinc-200"
          >
            ✕
          </button>
        </div>
      ) : null}

      {/* ── input bar ── */}
      <form
        onSubmit={handleSend}
        className="shrink-0 border-t border-zinc-800/60 bg-zinc-900/80 px-3 pb-[env(safe-area-inset-bottom,0.75rem)] pt-2.5 backdrop-blur-sm"
      >
        <div className="flex items-end gap-2">
          {/* attach button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Adjuntar archivo"
            className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          {/* hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,audio/*,video/*,*/*"
            className="sr-only"
            onChange={handleFileChange}
            aria-hidden="true"
          />

          {/* textarea */}
          <label htmlFor="drop-input" className="sr-only">
            Mensaje
          </label>
          <textarea
            ref={textareaRef}
            id="drop-input"
            value={content}
            onChange={handleTextareaChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void handleSend(e);
              }
            }}
            onPaste={(e) => {
              const items = e.clipboardData.items;
              for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.kind === "file" && item.type.startsWith("image/")) {
                  const file = item.getAsFile();
                  if (file) {
                    e.preventDefault();
                    setPendingFile(file);
                    return;
                  }
                }
              }
            }}
            placeholder={pendingFile ? "Añade un texto (opcional)…" : "Suelta algo temporal…"}
            rows={1}
            className="min-h-[2.5rem] flex-1 resize-none rounded-2xl border border-zinc-700/60 bg-zinc-800/60 px-3.5 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30"
            style={{ overflowY: "hidden" }}
          />

          {/* send button */}
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Enviar"
            className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white transition-all hover:bg-violet-500 disabled:opacity-40"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </form>

      {expandedImageUrl ? (
        <ImageExpandedOverlay
          path={expandedImageUrl}
          onClose={() => setExpandedImageUrl(null)}
        />
      ) : null}
    </div>
  );
}
