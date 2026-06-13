"use client";

import { Mic, FileText, Camera } from "lucide-react";

export type CaptureMode = "menu" | "voice" | "note" | "image";

interface CaptureMenuProps {
  onSelect: (mode: CaptureMode) => void;
}

export function CaptureMenu({ onSelect }: CaptureMenuProps) {
  const options = [
    {
      mode: "voice" as const,
      icon: Mic,
      label: "Grabar voz",
      desc: "Transcribe y clasifica con IA",
    },
    {
      mode: "note" as const,
      icon: FileText,
      label: "Nota de texto",
      desc: "Escribe una nota rápida",
    },
    {
      mode: "image" as const,
      icon: Camera,
      label: "Imagen",
      desc: "Captura o sube una foto",
    },
  ];

  return (
    <div className="content-list py-2">
      {options.map(({ mode, icon: Icon, label, desc }) => (
        <button
          key={mode}
          type="button"
          onClick={() => onSelect(mode)}
          className="content-row flex min-h-[72px] items-center gap-4"
        >
          <Icon className="h-6 w-6 shrink-0 text-zinc-400" />
          <div>
            <p className="font-semibold text-zinc-100">{label}</p>
            <p className="text-sm text-zinc-500">{desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
