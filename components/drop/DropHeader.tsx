"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronsDown, ChevronsUp, Zap } from "lucide-react";

const COLLAPSED_KEY = "drop-header-collapsed";

export function DropHeader({
  refreshing,
  onRefresh,
}: {
  refreshing: boolean;
  onRefresh: () => Promise<void>;
}) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "1");
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      return next;
    });
  }

  if (collapsed) {
    return (
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-800/60 px-2 py-1">
        <button
          type="button"
          onClick={() => router.push("/")}
          aria-label="Volver al inicio de Crack"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors active:bg-zinc-800 active:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        </button>
        <span className="truncate text-xs font-semibold text-zinc-500">Drop</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => void onRefresh()}
            aria-label="Refrescar Drop"
            aria-busy={refreshing}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-100 active:bg-zinc-800"
          >
            <Zap
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              strokeWidth={2}
            />
          </button>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label="Mostrar cabecera"
            aria-expanded={false}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-100 active:bg-zinc-800"
          >
            <ChevronsDown className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="shrink-0 border-b border-zinc-800/60 px-4 pb-3 pt-4">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/")}
          aria-label="Volver al inicio de Crack"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors active:bg-zinc-800 active:text-zinc-100"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            Crack
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            <h1 className="text-lg font-bold">Drop</h1>
            <button
              type="button"
              onClick={() => void onRefresh()}
              aria-label="Refrescar Drop"
              aria-busy={refreshing}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 active:bg-zinc-800"
            >
              <Zap
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                strokeWidth={2}
              />
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label="Ocultar cabecera"
          aria-expanded={true}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 active:bg-zinc-800"
        >
          <ChevronsUp className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
