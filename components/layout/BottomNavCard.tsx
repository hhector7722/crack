"use client";

import { Plus } from "lucide-react";
import { TabBar } from "@/components/layout/TabBar";
import { PagerDots } from "@/components/layout/PagerDots";
import { useAppShell } from "@/components/app-shell-context";

export function BottomNavCard() {
  const { openCaptureMenu } = useAppShell();

  return (
    <div className="relative flex flex-col items-center pt-2">
      <button
        type="button"
        onClick={openCaptureMenu}
        aria-label="Crear"
        className="tm-fab absolute left-1/2 top-0 z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-100 text-zinc-950 shadow-xl shadow-black/50 transition-transform active:scale-90"
      >
        <Plus className="h-6 w-6" strokeWidth={2} />
      </button>

      <div className="relative top-6 z-10">
        <PagerDots />
      </div>
      <TabBar />
    </div>
  );
}
