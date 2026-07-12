"use client";

import type { Drop } from "@/lib/drop/types";
import { DropBubble } from "./DropBubble";

export function DropMessages({
  drops,
  now,
  onExpandImage,
  onContentResize,
  scrollRef,
}: {
  drops: Drop[];
  now: number;
  onExpandImage: (paths: string[], index: number) => void;
  onContentResize?: () => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 [overflow-anchor:none]"
    >
      {drops.length === 0 ? (
        <p className="mt-16 text-center text-sm text-zinc-500">
          No hay Drops activos.
          <br />
          <span className="text-xs">Todo expira en 48 h.</span>
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {drops.map((drop) => (
            <DropBubble
              key={drop.id}
              drop={drop}
              now={now}
              onExpandImage={onExpandImage}
              onContentResize={onContentResize}
            />
          ))}
        </div>
      )}
    </div>
  );
}
