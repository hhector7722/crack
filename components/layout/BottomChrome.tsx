"use client";

import { usePathname, useRouter } from "next/navigation";
import { Search, Mic, FileEdit, Image, Zap, Plus } from "lucide-react";
import { PagerDots } from "@/components/layout/PagerDots";
import { useSearch } from "@/components/search-context";
import { useAppShell } from "@/components/app-shell-context";

export function BottomChrome() {
  const pathname = usePathname();
  const router = useRouter();
  const { toggleSearch } = useSearch();
  const { openCapture, openGallery } = useAppShell();

  if (pathname === "/login" || pathname.startsWith("/auth")) {
    return null;
  }

  return (
    <div
      data-tm-bottom-chrome
      className="tm-bottom-chrome pointer-events-none fixed bottom-0 left-0 right-0 z-[95] flex flex-col items-center pt-4"
    >
      <div className="pointer-events-auto absolute left-1/2 top-0 z-[96] flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-[#1c1c1e] px-2 py-1 shadow-xl shadow-black/50 ring-2 ring-white/20">
        <button
          type="button"
          onClick={toggleSearch}
          aria-label="Buscar"
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-300 transition-colors active:text-zinc-100 active:bg-zinc-800"
        >
          <Search className="h-[1rem] w-[1rem]" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => openCapture("voice")}
          aria-label="Grabar audio"
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-300 transition-colors active:text-zinc-100 active:bg-zinc-800"
        >
          <Mic className="h-[1rem] w-[1rem]" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => openCapture("note")}
          aria-label="Nueva nota"
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-300 transition-colors active:text-zinc-100 active:bg-zinc-800"
        >
          <FileEdit className="h-[1rem] w-[1rem]" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={openGallery}
          aria-label="Añadir imagen"
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-300 transition-colors active:text-zinc-100 active:bg-zinc-800"
        >
          <Image className="h-[1rem] w-[1rem]" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => router.push("/drop")}
          aria-label="Drop (efímero)"
          className="flex h-9 w-9 items-center justify-center rounded-full text-amber-400 transition-colors active:text-amber-200 active:bg-zinc-800"
        >
          <Zap className="h-[1rem] w-[1rem]" strokeWidth={2} />
        </button>
      </div>

      <div className="relative top-3 z-10">
        <PagerDots />
      </div>
    </div>
  );
}
