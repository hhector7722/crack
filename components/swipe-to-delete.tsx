"use client";

import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeToDeleteProps {
  onDelete: () => void;
  children: React.ReactNode;
  className?: string;
}

export function SwipeToDelete({
  onDelete,
  children,
  className,
}: SwipeToDeleteProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  const threshold = -80;

  function handleTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    currentX.current = startX.current;
    setSwiping(true);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!swiping) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    if (diff < 0) {
      setOffsetX(Math.max(diff, -120));
    }
  }

  function handleTouchEnd() {
    setSwiping(false);
    if (offsetX <= threshold) {
      if (window.confirm("¿Eliminar este item?")) {
        onDelete();
      }
    }
    setOffsetX(0);
  }

  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      <div className="absolute inset-y-0 right-0 flex w-24 items-center justify-center bg-red-600">
        <Trash2 className="h-5 w-5 text-white" />
      </div>
      <div
        className="relative bg-zinc-900 transition-transform"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: swiping ? "none" : "transform 0.2s ease",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
