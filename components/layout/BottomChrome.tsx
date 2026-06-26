"use client";

import { usePathname } from "next/navigation";
import { TabBar } from "@/components/layout/TabBar";
import { PagerDots } from "@/components/layout/PagerDots";
import { useSearch } from "@/components/search-context";

export function BottomChrome() {
  const pathname = usePathname();
  const { toggleSearch } = useSearch();

  if (pathname === "/login" || pathname.startsWith("/auth")) {
    return null;
  }

  return (
    <div
      data-tm-bottom-chrome
      className="tm-bottom-chrome pointer-events-none fixed bottom-0 left-0 right-0 z-[95] flex flex-col items-center pt-4"
    >
      <button
        type="button"
        onClick={toggleSearch}
        aria-label="Buscar"
        className="tm-fab pointer-events-auto absolute left-1/2 top-0 z-[96] flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black text-zinc-100 shadow-xl shadow-black/50 ring-1 ring-white/30 transition-transform active:scale-90"
      />

      <div className="relative top-3 z-10">
        <PagerDots />
      </div>
      <TabBar />
    </div>
  );
}
