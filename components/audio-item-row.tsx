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

  return (
    <div className="flex h-8 w-full items-end gap-px">
      {bars.map((h, i) => {
        const barStart = i / bars.length;
        const barEnd = (i + 1) / bars.length;
        let fillRatio = 0;
        if (active && progress > barStart) {
          fillRatio = Math.min(1, (progress - barStart) / (barEnd - barStart));
        }

        return (
          <div
            key={i}
            className={cn("relative min-w-0 flex-1 overflow-hidden rounded-full", unlit)}
            style={{ height: `${Math.round(h * 100)}%` }}
          >
            {fillRatio > 0 && (
              <div
                className={cn("absolute inset-y-0 left-0", lit)}
                style={{ width: `${fillRatio * 100}%` }}
              />
            )}
          </div>
        );
      })}
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
