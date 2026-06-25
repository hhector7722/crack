"use client";

import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Mic, FileEdit, Camera } from "lucide-react";
import { AppModal } from "@/components/app-modal";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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

  if (!open) return null;

  if (viewMode === "menu") {
    if (!mounted) return null;
    return createPortal(
      <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-black/40 backdrop-blur-md">
        <div className="absolute inset-0" onClick={() => handleClose(false)} />
        <div className="relative z-10 flex items-center justify-center gap-8">
          <button
            type="button"
            onClick={() => handleMenuSelect("voice")}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-black shadow-lg shadow-black/50 active:scale-95"
          >
            <Mic className="h-8 w-8 text-red-500" />
          </button>
          <button
            type="button"
            onClick={() => handleMenuSelect("note")}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-black shadow-lg shadow-black/50 active:scale-95"
          >
            <FileEdit className="h-8 w-8 text-white" />
          </button>
          <button
            type="button"
            onClick={() => handleMenuSelect("image")}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-black shadow-lg shadow-black/50 active:scale-95"
          >
            <Camera className="h-8 w-8 text-white" />
          </button>
        </div>
      </div>,
      document.body
    );
  }

  return (
    <AppModal open={open} onOpenChange={handleClose} title={titles[viewMode]}>
      {error ? <p className="mb-3 text-sm text-red-300">{error}</p> : null}

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
