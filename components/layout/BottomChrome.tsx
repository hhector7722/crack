"use client";

import { usePathname } from "next/navigation";
import { FileUp, Mic, Image, Home, Link2, type LucideIcon } from "lucide-react";
import { PagerDots } from "@/components/layout/PagerDots";
import { useAppShell } from "@/components/app-shell-context";
import { cn } from "@/lib/utils";

const NAV_ITEMS: { pageIndex: number; label: string; icon: LucideIcon }[] = [
  { pageIndex: 0, label: "Archivos", icon: FileUp },
  { pageIndex: 1, label: "Audios", icon: Mic },
  { pageIndex: 3, label: "Inicio", icon: Home },
  { pageIndex: 2, label: "Imágenes", icon: Image },
  { pageIndex: 4, label: "Enlaces", icon: Link2 },
];

export function BottomChrome() {
  const pathname = usePathname();
  const { pagerIndex, navigateToPage, openFilePicker, openCapture } = useAppShell();

  function handleNavAction(pageIndex: number) {
    switch (pageIndex) {
      case 0:
        openFilePicker();
        return;
      case 1:
        openCapture("voice");
        return;
      case 2:
        openCapture("image");
        return;
      case 4:
        navigateToPage(pageIndex);
        return;
      default:
        navigateToPage(pageIndex);
    }
  }

  if (pathname === "/login" || pathname.startsWith("/auth")) {
    return null;
  }

  return (
    <div
      data-tm-bottom-chrome
      className="tm-bottom-chrome pointer-events-none fixed bottom-0 left-0 right-0 z-[95] flex flex-col"
    >
      <div className="pointer-events-auto mx-3 flex items-center justify-around rounded-full bg-[#1c1c1e] px-2 py-3 shadow-xl shadow-black/50 ring-2 ring-white/20">
        {NAV_ITEMS.map(({ pageIndex, label, icon: Icon }) => {
          const active = pagerIndex === pageIndex;

          return (
            <button
              key={label}
              type="button"
              onClick={() => handleNavAction(pageIndex)}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full transition-colors active:bg-zinc-800",
                active
                  ? "text-zinc-100"
                  : "text-zinc-300 active:text-zinc-100"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
            </button>
          );
        })}
      </div>

      <div className="relative top-3 z-10">
        <PagerDots />
      </div>
    </div>
  );
}
