"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Home, FileText, Images, Mic, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppShell } from "@/components/app-shell-context";
import { PAGE_PUSH_MS, IOS_EASE_OUT } from "@/lib/ui/motion";
import { useVisualViewportBottomPin } from "@/lib/ui/use-visual-viewport-bottom-pin";
import {
  PAGER_DOT_INDICES,
  PAGER_PATHS,
  pagerIndexToDotIndex,
} from "@/lib/pager-routes";

export function TabBar() {
  const { openCaptureMenu, pagerIndex, navigateToPage } = useAppShell();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useVisualViewportBottomPin(anchorRef, mounted);

  useEffect(() => {
    setMounted(true);
  }, []);

  const bar = (
    <div ref={anchorRef} className="app-tabbar-anchor app-fixed-bottombar">
      <div className="app-tabbar-chrome mx-auto flex w-full max-w-[430px] flex-col items-center pt-2">
        <button
          type="button"
          onClick={openCaptureMenu}
          aria-label="Crear"
          className="relative z-50 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-950 shadow-lg shadow-black/40 transition-transform active:scale-95"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>

        <div
          className="mt-2 flex h-1.5 min-h-1.5 items-center gap-1.5"
          role="tablist"
          aria-label="Páginas centrales"
        >
          {PAGER_PATHS.map((path, dotIndex) => {
            const pageIndex = PAGER_DOT_INDICES[dotIndex];
            const active = pagerIndexToDotIndex(pagerIndex) === pageIndex;
            return (
              <button
                key={path}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`Página ${dotIndex + 1}`}
                onClick={() => navigateToPage(pageIndex)}
                className={cn(
                  "h-1.5 shrink-0 rounded-full bg-white opacity-50",
                  active ? "w-4 opacity-100" : "w-1.5"
                )}
                style={{
                  transition: `width ${PAGE_PUSH_MS}ms ${IOS_EASE_OUT}, opacity ${PAGE_PUSH_MS}ms ${IOS_EASE_OUT}`,
                }}
              />
            );
          })}
        </div>
      </div>

      <nav className="app-tabbar-dock" aria-label="Navegación principal">
        <div className="mx-auto flex w-full max-w-[430px] items-end justify-between px-1 pt-1 pb-1">
          <TabButton
            label="Audio"
            icon={Mic}
            active={pagerIndex === 0}
            onClick={() => navigateToPage(0)}
          />
          <TabButton
            label="Galería"
            icon={Images}
            active={pagerIndex === 1}
            onClick={() => navigateToPage(1)}
          />
          <TabButton
            label="Inicio"
            icon={Home}
            active={pagerIndex === 2}
            onClick={() => navigateToPage(2)}
          />
          <TabButton
            label="Notas"
            icon={FileText}
            active={pagerIndex === 3}
            onClick={() => navigateToPage(3)}
          />
          <TabButton
            label="Perfil"
            icon={User}
            active={pagerIndex === 4}
            onClick={() => navigateToPage(4)}
          />
        </div>
      </nav>
    </div>
  );

  if (!mounted) return null;
  return createPortal(bar, document.body);
}

function TabButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-w-[56px] flex-1 flex-col-reverse items-center gap-0.5 rounded-lg pt-1 pb-1 text-xs leading-none transition-colors",
        active ? "text-zinc-100" : "text-zinc-500"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
      <span className="font-medium">{label}</span>
    </button>
  );
}
