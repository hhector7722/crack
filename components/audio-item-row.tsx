"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Item } from "@/lib/types";

function seedBars(id: string, count: number): number[] {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Array.from({ length: count }, (_, i) => {
    const n = Math.abs(Math.sin(hash * (i + 1) * 12.9898) * 43758.5453);
    return 0.25 + (n - Math.floor(n)) * 0.75;
  });
}

function BarLayer({
  bars,
  color,
}: {
  bars: number[];
  color: string;
}) {
  return (
    <>
      {bars.map((h, i) => (
        <div
          key={i}
          className={cn("min-w-0 flex-1 rounded-full", color)}
          style={{ height: `${Math.round(h * 100)}%` }}
        />
      ))}
    </>
  );
}

export function AudioWaveform({
  bars,
  progress,
  active,
}: {
  bars: number[];
  progress: number;
  active: boolean;
}) {
  const fill = active ? Math.min(1, Math.max(0, progress)) : 0;

  return (
    <div className="relative h-5 w-full">
      <div className="flex h-full w-full items-end gap-px">
        <BarLayer bars={bars} color="bg-zinc-700" />
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${fill * 100}%` }}
      >
        <div className="flex h-full w-full items-end gap-px">
          <BarLayer bars={bars} color="bg-rose-500" />
        </div>
      </div>
    </div>
  );
}

interface AudioItemRowProps {
  item: Item;
  playing: boolean;
  progress: number;
  onTogglePlay: () => void;
  onOpen?: () => void;
}

export function AudioItemRow({
  item,
  playing,
  progress,
  onTogglePlay,
  onOpen,
}: AudioItemRowProps) {
  const bars = useMemo(() => seedBars(item.id, 40), [item.id]);
  const transcript =
    item.metadata.raw_transcript ??
    item.metadata.summary ??
    item.content ??
    " ";

  return (
    <div className="flex items-start gap-3 py-3">
      <button
        type="button"
        onClick={onTogglePlay}
        aria-label={playing ? "Pausar" : "Reproducir"}
        className="flex h-12 w-12 shrink-0 items-center justify-center text-sm font-bold text-zinc-200 active:opacity-70"
      >
        {playing ? "❚❚" : "▶"}
      </button>

      <div className="min-w-0 flex-1">
        <AudioWaveform bars={bars} progress={progress} active={playing} />
        {onOpen ? (
          <button
            type="button"
            onClick={onOpen}
            className="mt-1.5 w-full text-left text-xs leading-relaxed text-zinc-400 active:opacity-70"
          >
            {transcript}
          </button>
        ) : (
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
            {transcript}
          </p>
        )}
      </div>
    </div>
  );
}
