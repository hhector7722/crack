"use client";

export type CaptureMenuMode = "voice" | "note" | "image";

interface CaptureMenuProps {
  onSelect: (mode: CaptureMenuMode) => void;
}

export function CaptureMenu({ onSelect }: CaptureMenuProps) {
  const options = [
    { mode: "voice" as const, label: "Grabar voz", desc: "Transcribe y clasifica con IA" },
    { mode: "note" as const, label: "Nota de texto", desc: "Escribe una nota rápida" },
    { mode: "image" as const, label: "Imagen", desc: "Captura o sube una foto" },
  ];

  return (
    <div className="content-list">
      {options.map(({ mode, label, desc }) => (
        <button
          key={mode}
          type="button"
          onClick={() => onSelect(mode)}
          className="content-row min-h-12 text-left"
        >
          <span className="block font-semibold text-zinc-100">{label}</span>
          <span className="block text-sm text-zinc-500">{desc}</span>
        </button>
      ))}
    </div>
  );
}
