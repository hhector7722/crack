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
      className="tm-bottom-chrome fixed bottom-0 left-0 right-0 z-[95] flex flex-col items-center bg-[var(--tm-tabbar-bg-hex)] pt-4"
    >
      <button
        type="button"
        onClick={openCaptureMenu}
        aria-label="Crear"
        className="tm-fab absolute left-1/2 top-0 z-[96] flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-100 text-zinc-950 shadow-xl shadow-black/50 transition-transform active:scale-90"
      >
        <Plus className="h-6 w-6" strokeWidth={2} />
      </button>

      <PagerDots />
      <TabBar />
    </div>
  );
}
