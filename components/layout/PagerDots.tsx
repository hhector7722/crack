"use client";

import { cn } from "@/lib/utils";
import { useAppShell } from "@/components/app-shell-context";
import {
  PAGER_DOT_INDICES,
  PAGER_PATHS,
  pagerIndexToDotIndex,
} from "@/lib/pager-routes";

export function PagerDots() {
  const { pagerIndex, navigateToPage } = useAppShell();

  return (
    <div
      className="pointer-events-auto flex h-[var(--tm-chrome-dots)] min-h-[var(--tm-chrome-dots)] shrink-0 items-center justify-center gap-1.5"
      role="tablist"
      aria-label="Paginas"
    >
      {PAGER_PATHS.map((path, dotIndex) => {
        const active = pagerIndex === dotIndex;

        return (
          <button
            key={path}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={`Pagina ${dotIndex + 1}`}
            onClick={() => navigateToPage(dotIndex)}
            className={cn(
              "h-1.5 shrink-0 rounded-full bg-white transition-all duration-300",
              active ? "w-4 opacity-100" : "w-1.5 opacity-50"
            )}
          />
        );
      })}
    </div>
  );
}
