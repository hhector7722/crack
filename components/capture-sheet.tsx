"use client";

import { useRef, useState } from "react";
import { BottomSheet } from "@/components/bottom-sheet";
import { CaptureMenu, type CaptureMode } from "@/components/capture-menu";
import { VoiceRecorder } from "@/components/voice-recorder";
import { NoteCapture, type NoteCaptureHandle } from "@/components/note-capture";
import { ImageCapture } from "@/components/image-capture";

interface CaptureSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function CaptureSheet({ open, onOpenChange, onSaved }: CaptureSheetProps) {
  const [mode, setMode] = useState<CaptureMode>("menu");
  const [error, setError] = useState<string | null>(null);
  const noteRef = useRef<NoteCaptureHandle>(null);

  async function handleClose(nextOpen: boolean) {
    if (!nextOpen && mode === "note") {
      const saved = await noteRef.current?.saveIfNeeded();
      noteRef.current?.reset();
      if (saved) onSaved();
    }

    if (!nextOpen) {
      setMode("menu");
      setError(null);
    }
    onOpenChange(nextOpen);
  }

  function handleSaved() {
    setMode("menu");
    setError(null);
    onOpenChange(false);
    onSaved();
  }

  const titles: Record<CaptureMode, string> = {
    menu: "Nuevo",
    voice: "Grabar voz",
    note: "Nota de texto",
    image: "Imagen",
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={handleClose}
      title={titles[mode]}
    >
      {error && (
        <p className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {mode === "menu" && (
        <CaptureMenu onSelect={(m) => setMode(m)} />
      )}

      {mode === "voice" && (
        <VoiceRecorder
          onSaved={handleSaved}
          onError={setError}
        />
      )}

      {mode === "note" && (
        <NoteCapture
          ref={noteRef}
          onSaved={handleSaved}
          onError={setError}
        />
      )}

      {mode === "image" && (
        <ImageCapture onSaved={handleSaved} onError={setError} />
      )}

      {mode !== "menu" && (
        <button
          type="button"
          onClick={() => setMode("menu")}
          className="mt-4 w-full py-2 text-sm text-zinc-500"
        >
          ← Volver
        </button>
      )}
    </BottomSheet>
  );
}
