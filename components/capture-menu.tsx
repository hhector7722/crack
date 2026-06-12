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
    <div className="space-y-3 py-2">
      {options.map(({ mode, icon: Icon, label, desc }) => (
        <button
          key={mode}
          type="button"
          onClick={() => onSelect(mode)}
          className="flex min-h-[72px] w-full items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-left transition-colors hover:bg-zinc-800"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-800">
            <Icon className="h-6 w-6 text-zinc-200" />
          </div>
          <div>
            <p className="font-semibold text-zinc-100">{label}</p>
            <p className="text-sm text-zinc-500">{desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
