"use client";

import { useRef, useState } from "react";
import { BottomSheet } from "@/components/bottom-sheet";
import { CaptureMenu } from "@/components/capture-menu";
import { VoiceRecorder } from "@/components/voice-recorder";
import { NoteCapture, type NoteCaptureHandle } from "@/components/note-capture";
import { useAppShell } from "@/components/app-shell-context";
import type { CaptureMode } from "@/components/app-shell-context";

interface CaptureSheetProps {
  open: boolean;
  mode: CaptureMode;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function CaptureSheet({
  open,
  mode,
  onOpenChange,
  onSaved,
}: CaptureSheetProps) {
  const { openGallery } = useAppShell();
  const [viewMode, setViewMode] = useState<CaptureMode>(mode);
  const [error, setError] = useState<string | null>(null);
  const noteRef = useRef<NoteCaptureHandle>(null);

  async function handleClose(nextOpen: boolean) {
    if (!nextOpen && viewMode === "note") {
      const saved = await noteRef.current?.saveIfNeeded();
      noteRef.current?.reset();
      if (saved) onSaved();
    }
    if (!nextOpen) setError(null);
    onOpenChange(nextOpen);
  }

  function handleSaved() {
    setError(null);
    onOpenChange(false);
    onSaved();
  }

  function handleMenuSelect(selected: "voice" | "note" | "image") {
    if (selected === "image") {
      onOpenChange(false);
      openGallery();
      return;
    }
    setViewMode(selected);
  }

  const titles: Record<CaptureMode, string> = {
    menu: "Nuevo",
    voice: "Grabar voz",
    note: "Nota de texto",
  };

  const showBack = mode === "menu" && viewMode !== "menu";

  return (
    <BottomSheet open={open} onOpenChange={handleClose} title={titles[viewMode]}>
      {error && <p className="mb-3 text-sm text-red-300">{error}</p>}

      {viewMode === "menu" && <CaptureMenu onSelect={handleMenuSelect} />}

      {viewMode === "voice" && (
        <VoiceRecorder onSaved={handleSaved} onError={setError} />
      )}

      {viewMode === "note" && (
        <NoteCapture ref={noteRef} onSaved={handleSaved} onError={setError} />
      )}

      {showBack && (
        <button
          type="button"
          onClick={() => setViewMode("menu")}
          className="mt-4 w-full py-2 text-sm text-zinc-500"
        >
          ← Volver
        </button>
      )}
    </BottomSheet>
  );
}
