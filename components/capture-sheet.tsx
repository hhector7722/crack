"use client";

import { useRef, useState } from "react";
import { AppModal } from "@/components/app-modal";
import { CaptureMenu } from "@/components/capture-menu";
import { VoiceRecorder } from "@/components/voice-recorder";
import { NoteCapture, type NoteCaptureHandle } from "@/components/note-capture";
import { useAppShell } from "@/components/app-shell-context";
import type { CaptureMode } from "@/components/app-shell-context";

type ViewMode = CaptureMode | "image";

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
  const { openCamera, openGallery } = useAppShell();
  const [viewMode, setViewMode] = useState<ViewMode>(mode);
  const [error, setError] = useState<string | null>(null);
  const noteRef = useRef<NoteCaptureHandle>(null);

  async function handleClose(nextOpen: boolean) {
    if (!nextOpen && viewMode === "note") {
      const saved = await noteRef.current?.saveIfNeeded();
      noteRef.current?.reset();
      if (saved) onSaved();
    }
    if (!nextOpen) {
      setError(null);
      setViewMode(mode);
    }
    onOpenChange(nextOpen);
  }

  function handleSaved() {
    setError(null);
    onOpenChange(false);
    onSaved();
  }

  function handleMenuSelect(selected: "voice" | "note" | "image") {
    if (selected === "image") {
      setViewMode("image");
      return;
    }
    setViewMode(selected);
  }

  function pickImage(source: "camera" | "gallery") {
    onOpenChange(false);
    if (source === "camera") {
      openCamera();
      return;
    }
    openGallery();
  }

  const titles: Record<ViewMode, string> = {
    menu: "Nuevo",
    voice: "Grabar voz",
    note: "Nota de texto",
    image: "Añadir imagen",
  };

  const showBack = mode === "menu" && viewMode !== "menu";

  return (
    <AppModal open={open} onOpenChange={handleClose} title={titles[viewMode]}>
      {error ? <p className="mb-3 text-sm text-red-300">{error}</p> : null}

      {viewMode === "menu" ? <CaptureMenu onSelect={handleMenuSelect} /> : null}

      {viewMode === "image" ? (
        <div className="content-list">
          <button
            type="button"
            onClick={() => pickImage("camera")}
            className="content-row min-h-12 text-left"
          >
            <span className="block font-semibold text-zinc-100">Cámara</span>
            <span className="block text-sm text-zinc-500">Hacer una foto nueva</span>
          </button>
          <button
            type="button"
            onClick={() => pickImage("gallery")}
            className="content-row min-h-12 text-left"
          >
            <span className="block font-semibold text-zinc-100">Galería</span>
            <span className="block text-sm text-zinc-500">Elegir del dispositivo</span>
          </button>
        </div>
      ) : null}

      {viewMode === "voice" ? (
        <VoiceRecorder onSaved={handleSaved} onError={setError} />
      ) : null}

      {viewMode === "note" ? (
        <NoteCapture ref={noteRef} onSaved={handleSaved} onError={setError} />
      ) : null}

      {showBack ? (
        <button
          type="button"
          onClick={() => setViewMode("menu")}
          className="action-ghost mt-2 min-h-12 text-zinc-500"
        >
          Volver
        </button>
      ) : null}
    </AppModal>
  );
}
