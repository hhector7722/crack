"use client";

import { File, Loader2, Paperclip, Send } from "lucide-react";
import { isImageFile } from "@/lib/drop/helpers";
import { PendingImageThumb } from "./PendingImageThumb";

export function DropComposer({
  content,
  onContentChange,
  pendingFiles,
  canSend,
  sending,
  error,
  onSend,
  onFileChange,
  onRemovePendingFile,
  onPasteFile,
  fileInputRef,
  textareaRef,
}: {
  content: string;
  onContentChange: (value: string) => void;
  pendingFiles: File[];
  canSend: boolean;
  sending: boolean;
  error: string | null;
  onSend: (e: React.FormEvent) => Promise<void>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePendingFile: (index: number) => void;
  onPasteFile?: (file: File) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onContentChange(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  return (
    <>
      {error ? (
        <p className="shrink-0 px-4 py-1 text-center text-xs text-red-400">
          {error}
        </p>
      ) : null}

      {pendingFiles.length > 0 ? (
        <div className="shrink-0 border-t border-zinc-800/60 bg-zinc-900/60 px-4 py-2">
          <div className="flex flex-wrap items-center gap-2">
            {pendingFiles.map((file, i) =>
              isImageFile(file) ? (
                <PendingImageThumb
                  key={`${file.name}-${i}`}
                  file={file}
                  onRemove={() => onRemovePendingFile(i)}
                />
              ) : (
                <div
                  key={`${file.name}-${i}`}
                  className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-2 py-1"
                >
                  <File className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                  <span className="max-w-[120px] truncate text-[11px] text-zinc-300">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemovePendingFile(i)}
                    aria-label="Quitar archivo"
                    className="shrink-0 text-xs text-zinc-500 hover:text-zinc-200"
                  >
                    ✕
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      ) : null}

      <form
        onSubmit={onSend}
        className="shrink-0 border-t border-zinc-800/60 bg-zinc-900/80 px-3 pb-[env(safe-area-inset-bottom,0.75rem)] pt-2.5 backdrop-blur-sm"
      >
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Adjuntar archivo"
            className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="sr-only"
            onChange={onFileChange}
            aria-hidden="true"
          />

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
                void onSend(e);
              }
            }}
            onPaste={(e) => {
              if (!onPasteFile) return;
              const items = e.clipboardData.items;
              let handled = false;
              for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.kind === "file") {
                  const file = item.getAsFile();
                  if (file) {
                    if (!handled) e.preventDefault();
                    handled = true;
                    onPasteFile(file);
                  }
                }
              }
            }}
            placeholder={pendingFiles.length > 0 ? "Añade un texto (opcional)…" : "Suelta algo temporal…"}
            rows={1}
            className="min-h-[2.5rem] flex-1 resize-none rounded-2xl border border-zinc-700/60 bg-zinc-800/60 px-3.5 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30"
            style={{ overflowY: "hidden" }}
          />

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
    </>
  );
}
