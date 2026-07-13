"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Loader2, X } from "lucide-react";
import type { DropVideoViewerState } from "@/lib/drop/types";
import { downloadSignedFile, useSignedUrl } from "@/lib/drop/signed-url-cache";
import { cn } from "@/lib/utils";

export function DropVideoOverlay({
  viewer,
  onIndexChange,
  onClose,
}: {
  viewer: DropVideoViewerState;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const { paths, index } = viewer;
  const path = paths[index];
  const url = useSignedUrl(path);
  const hasMultiple = paths.length > 1;
  const canGoPrev = index > 0;
  const canGoNext = index < paths.length - 1;
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!path || downloading) return;
    setDownloading(true);
    try {
      await downloadSignedFile(path);
    } catch {
      /* ignore */
    } finally {
      setDownloading(false);
    }
  }, [downloading, path]);

  const goPrev = useCallback(() => {
    if (canGoPrev) onIndexChange(index - 1);
  }, [canGoPrev, index, onIndexChange]);

  const goNext = useCallback(() => {
    if (canGoNext) onIndexChange(index + 1);
  }, [canGoNext, index, onIndexChange]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev, onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={() => void handleDownload()}
        disabled={!url || downloading}
        aria-label="Guardar vídeo"
        className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 disabled:opacity-50"
      >
        {downloading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Download className="h-5 w-5" />
        )}
      </button>

      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
      >
        <X className="h-5 w-5" />
      </button>

      {hasMultiple ? (
        <p className="pointer-events-none absolute top-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-zinc-300">
          {index + 1} / {paths.length}
        </p>
      ) : null}

      {hasMultiple && canGoPrev ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          aria-label="Vídeo anterior"
          className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      ) : null}

      {hasMultiple && canGoNext ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          aria-label="Vídeo siguiente"
          className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      ) : null}

      {url ? (
        <video
          key={path}
          src={url}
          controls
          autoPlay
          playsInline
          className={cn(
            "max-h-full max-w-full rounded-lg",
            hasMultiple ? "px-14" : ""
          )}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      )}
    </div>
  );
}
