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
  light,
}: {
  bars: number[];
  progress: number;
  active: boolean;
  light?: boolean;
}) {
  const unlit = light ? "bg-zinc-200" : "bg-zinc-700";
  const lit = "bg-rose-500";
  const fill = active ? Math.min(1, Math.max(0, progress)) : 0;

  return (
    <div className="relative h-8 w-full">
      <div className="flex h-full w-full items-end gap-px">
        <BarLayer bars={bars} color={unlit} />
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)`,
        }}
      >
        <div className="flex h-full w-full items-end gap-px">
          <BarLayer bars={bars} color={lit} />
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
  light?: boolean;
}

export function AudioItemRow({
  item,
  playing,
  progress,
  onTogglePlay,
  onOpen,
  light,
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
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center text-xs font-bold active:opacity-70",
          light ? "text-zinc-700" : "text-zinc-200"
        )}
      >
        {playing ? "❚❚" : "▶"}
      </button>

      <div className="min-w-0 flex-1">
        <AudioWaveform bars={bars} progress={progress} active={playing} light={light} />
        {onOpen ? (
          <button
            type="button"
            onClick={onOpen}
            className={cn(
              "mt-1.5 w-full text-left text-xs leading-relaxed active:opacity-70",
              light ? "text-zinc-500" : "text-zinc-400"
            )}
          >
            {transcript}
          </button>
        ) : (
          <p
            className={cn(
              "mt-1.5 text-xs leading-relaxed",
              light ? "text-zinc-500" : "text-zinc-400"
            )}
          >
            {transcript}
          </p>
        )}
      </div>
    </div>
  );
}
