"use client";

import { useRef, useState } from "react";
import { BottomSheet } from "@/components/bottom-sheet";
import { VoiceRecorder } from "@/components/voice-recorder";
import { NoteCapture, type NoteCaptureHandle } from "@/components/note-capture";
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
  const [error, setError] = useState<string | null>(null);
  const noteRef = useRef<NoteCaptureHandle>(null);

  async function handleClose(nextOpen: boolean) {
    if (!nextOpen && mode === "note") {
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

  const titles: Record<CaptureMode, string> = {
    voice: "Grabar voz",
    note: "Nota de texto",
  };

  return (
    <BottomSheet open={open} onOpenChange={handleClose} title={titles[mode]}>
      {error && (
        <p className="mb-3 text-sm text-red-300">{error}</p>
      )}

      {mode === "voice" && (
        <VoiceRecorder onSaved={handleSaved} onError={setError} />
      )}

      {mode === "note" && (
        <NoteCapture ref={noteRef} onSaved={handleSaved} onError={setError} />
      )}
    </BottomSheet>
  );
}
