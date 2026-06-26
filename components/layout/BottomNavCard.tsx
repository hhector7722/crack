"use client";

import { TabBar } from "@/components/layout/TabBar";
import { PagerDots } from "@/components/layout/PagerDots";
import { useSearch } from "@/components/search-context";

export function BottomNavCard() {
  const { toggleSearch } = useSearch();

  return (
    <div className="relative flex flex-col items-center pt-2">
      <button
        type="button"
        onClick={toggleSearch}
        aria-label="Buscar"
        className="tm-fab absolute left-1/2 top-0 z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black text-zinc-100 shadow-xl shadow-black/50 ring-1 ring-white/30 transition-transform active:scale-90"
      />

      <div className="relative top-6 z-10">
        <PagerDots />
      </div>
      <TabBar />
    </div>
  );
}
