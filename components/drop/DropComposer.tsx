"use client";

import { useRef, useState } from "react";
import { Camera, File, Image as ImageIcon, Loader2, Plus, Send } from "lucide-react";
import { PendingMediaThumb } from "./PendingMediaThumb";
import { HoldToRecordButton } from "./HoldToRecordButton";

function filesFromInput(event: React.ChangeEvent<HTMLInputElement>) {
  const files = Array.from(event.target.files ?? []);
  event.target.value = "";
  return files;
}

export function DropComposer({
  content,
  onContentChange,
  pendingFiles,
  canSend,
  sending,
  error,
  onSend,
  onAddPendingFiles,
  onGallerySelected,
  onSendAudio,
  onRecordingError,
  onRemovePendingFile,
  onPasteFile,
  textareaRef,
}: {
  content: string;
  onContentChange: (value: string) => void;
  pendingFiles: File[];
  canSend: boolean;
  sending: boolean;
  error: string | null;
  onSend: (e: React.FormEvent) => Promise<void>;
  onAddPendingFiles: (files: File[]) => void;
  onGallerySelected: (files: File[]) => void;
  onSendAudio: (file: File) => Promise<boolean>;
  onRecordingError: (message: string) => void;
  onRemovePendingFile: (index: number) => void;
  onPasteFile?: (file: File) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onContentChange(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  return (
    <>
      {error ? <p className="shrink-0 px-4 py-1 text-center text-xs text-red-400">{error}</p> : null}

      {pendingFiles.length > 0 ? (
        <div className="min-w-0 shrink-0 border-t border-zinc-800/60 bg-zinc-900/60 px-2 py-2 sm:px-4">
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            {pendingFiles.map((file, i) => (
              <PendingMediaThumb key={`${file.name}-${i}`} file={file} onRemove={() => onRemovePendingFile(i)} />
            ))}
          </div>
        </div>
      ) : null}

      <form
        onSubmit={onSend}
        className="relative min-w-0 shrink-0 border-t border-zinc-800/60 bg-zinc-900/90 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2.5 backdrop-blur-sm sm:px-3"
      >
        {moreOpen ? (
          <div className="absolute bottom-[calc(100%+0.5rem)] left-12 z-20 w-44 overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 p-1 shadow-xl shadow-black/60">
            <button
              type="button"
              onClick={() => { setMoreOpen(false); cameraInputRef.current?.click(); }}
              className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-sm text-zinc-200 active:bg-zinc-800"
            >
              <Camera className="h-5 w-5 text-zinc-400" /> Cámara
            </button>
            <button
              type="button"
              onClick={() => { setMoreOpen(false); fileInputRef.current?.click(); }}
              className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-sm text-zinc-200 active:bg-zinc-800"
            >
              <File className="h-5 w-5 text-zinc-400" /> Archivo
            </button>
          </div>
        ) : null}

        <div className="flex min-w-0 items-end gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            aria-label="Elegir imágenes o vídeos"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-zinc-400 active:bg-zinc-800"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            aria-label="Más opciones"
            aria-expanded={moreOpen}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-zinc-400 active:bg-zinc-800"
          >
            <Plus className="h-5 w-5" />
          </button>

          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="sr-only"
            onChange={(event) => {
              const files = filesFromInput(event);
              if (files.length) onGallerySelected(files);
            }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*,video/*"
            capture="environment"
            className="sr-only"
            onChange={(event) => {
              const files = filesFromInput(event);
              if (files.length) onAddPendingFiles(files);
            }}
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="sr-only"
            onChange={(event) => {
              const files = filesFromInput(event);
              if (files.length) onAddPendingFiles(files);
            }}
          />

          <label htmlFor="drop-input" className="sr-only">Mensaje</label>
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
              for (const item of Array.from(e.clipboardData.items)) {
                if (item.kind !== "file") continue;
                const file = item.getAsFile();
                if (!file) continue;
                e.preventDefault();
                onPasteFile(file);
              }
            }}
            placeholder={pendingFiles.length > 0 ? "Texto opcional…" : "Suelta algo…"}
            rows={1}
            className="min-h-11 min-w-0 flex-1 resize-none rounded-2xl border border-zinc-700/60 bg-zinc-800/60 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30"
            style={{ overflowY: "hidden" }}
          />

          <HoldToRecordButton disabled={sending} onSendAudio={onSendAudio} onError={onRecordingError} />

          <button
            type="submit"
            disabled={!canSend}
            aria-label="Enviar"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white transition-all active:bg-violet-500 disabled:opacity-40"
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </form>
    </>
  );
}
