"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FabButtonProps {
  onClick: () => void;
  className?: string;
}

export function FabButton({ onClick, className }: FabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Crear"
      className={cn(
        "fixed left-1/2 z-50 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-zinc-100 text-zinc-950 shadow-lg shadow-black/40 transition-transform active:scale-95",
        className
      )}
      style={{ bottom: "calc(3.75rem + env(safe-area-inset-bottom))" }}
    >
      <Plus className="h-7 w-7" strokeWidth={2.5} />
    </button>
  );
}
