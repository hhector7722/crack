"use client";

import { useRef, useState } from "react";
import { Camera, Images } from "lucide-react";
import { BottomSheet } from "@/components/bottom-sheet";
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
    <BottomSheet open={open} onOpenChange={handleClose} title={titles[viewMode]}>
      {error && <p className="mb-3 text-sm text-red-300">{error}</p>}

      {viewMode === "menu" && <CaptureMenu onSelect={handleMenuSelect} />}

      {viewMode === "image" && (
        <div className="content-list py-2">
          <button
            type="button"
            onClick={() => pickImage("camera")}
            className="content-row flex min-h-[72px] items-center gap-4"
          >
            <Camera className="h-6 w-6 shrink-0 text-zinc-400" />
            <div className="text-left">
              <p className="font-semibold text-zinc-100">Cámara</p>
              <p className="text-sm text-zinc-500">Hacer una foto nueva</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => pickImage("gallery")}
            className="content-row flex min-h-[72px] items-center gap-4"
          >
            <Images className="h-6 w-6 shrink-0 text-zinc-400" />
            <div className="text-left">
              <p className="font-semibold text-zinc-100">Galería</p>
              <p className="text-sm text-zinc-500">Elegir del dispositivo</p>
            </div>
          </button>
        </div>
      )}

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
