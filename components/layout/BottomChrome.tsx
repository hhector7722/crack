"use client";

import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { TabBar } from "@/components/layout/TabBar";
import { PagerDots } from "@/components/layout/PagerDots";
import { useAppShell } from "@/components/app-shell-context";

export function BottomChrome() {
  const pathname = usePathname();
  const { openCaptureMenu } = useAppShell();

  if (pathname === "/login" || pathname.startsWith("/auth")) {
    return null;
  }

  return (
    <div
      data-tm-bottom-chrome
      className="tm-bottom-chrome fixed bottom-0 left-0 right-0 z-[95] flex flex-col items-center bg-[var(--tm-tabbar-bg-hex)] pb-safe"
    >
      <div className="flex h-[var(--tm-chrome-fab)] w-full max-w-[430px] shrink-0 items-center justify-center">
        <button
          type="button"
          onClick={openCaptureMenu}
          aria-label="Crear"
          className="flex h-12 min-h-12 w-12 min-w-12 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-950 shadow-lg shadow-black/40 transition-transform active:scale-95"
        >
          <Plus className="h-6 w-6" strokeWidth={2} />
        </button>
      </div>

      <PagerDots />
      <TabBar />
    </div>
  );
}
