"use client";

import { useEffect, useState } from "react";
import { Loader2, Play, Send, X } from "lucide-react";

function MediaPreview({ file }: { file: File }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!url) return <div className="h-full w-full animate-pulse bg-zinc-800" />;
  if (file.type.startsWith("video/")) {
    return (
      <div className="relative h-full w-full">
        <video src={url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
        <Play className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 fill-white text-white" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={file.name} className="h-full w-full object-cover" />
  );
}

export function DropMediaComposer({
  files,
  sending,
  onFilesChange,
  onClose,
  onSend,
}: {
  files: File[];
  sending: boolean;
  onFilesChange: (files: File[]) => void;
  onClose: () => void;
  onSend: (comment: string, files: File[]) => Promise<boolean>;
}) {
  const [comment, setComment] = useState("");

  return (
    <div className="fixed inset-x-0 top-[var(--tm-vv-offset-top,0px)] z-[120] flex h-[var(--tm-vv-height,100dvh)] flex-col bg-zinc-950 text-zinc-100">
      <header className="flex min-h-16 shrink-0 items-center gap-3 border-b border-zinc-800 px-3 pt-[env(safe-area-inset-top)]">
        <button
          type="button"
          onClick={onClose}
          disabled={sending}
          aria-label="Cerrar compositor multimedia"
          className="flex h-12 w-12 items-center justify-center rounded-full text-zinc-300 active:bg-zinc-800 disabled:opacity-40"
        >
          <X className="h-6 w-6" />
        </button>
        <div>
          <h2 className="font-semibold">Enviar multimedia</h2>
          <p className="text-xs text-zinc-500">{files.length} seleccionado{files.length === 1 ? "" : "s"}</p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {files.map((file, index) => (
            <div key={`${file.name}-${file.lastModified}-${index}`} className="relative aspect-square overflow-hidden rounded-xl bg-zinc-900">
              <MediaPreview file={file} />
              <button
                type="button"
                onClick={() => {
                  const next = files.filter((_, fileIndex) => fileIndex !== index);
                  onFilesChange(next);
                  if (next.length === 0) onClose();
                }}
                disabled={sending}
                aria-label={`Quitar ${file.name}`}
                className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full bg-black/70 text-white disabled:opacity-40"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="shrink-0 border-t border-zinc-800 bg-zinc-950 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3">
        <div className="flex items-end gap-2">
          <label htmlFor="drop-media-comment" className="sr-only">Añadir un comentario</label>
          <textarea
            id="drop-media-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={1}
            placeholder="Añadir un comentario…"
            className="min-h-12 min-w-0 flex-1 resize-none rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm outline-none placeholder:text-zinc-500 focus:border-zinc-500"
          />
          <button
            type="button"
            onClick={() => void onSend(comment, files)}
            disabled={sending || files.length === 0}
            aria-label="Enviar multimedia"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white disabled:opacity-40"
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
