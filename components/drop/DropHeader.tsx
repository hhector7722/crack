"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function DropHeader() {
  const router = useRouter();

  return (
    <header className="shrink-0 border-b border-zinc-800/60 px-4 pb-3 pt-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/")}
          aria-label="Volver al inicio de Crack"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors active:bg-zinc-800 active:text-zinc-100"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} />
        </button>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            Crack
          </p>
          <h1 className="mt-0.5 text-lg font-bold">Drop</h1>
        </div>
      </div>
    </header>
  );
}
