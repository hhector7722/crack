"use client";

import { Home, Mic, Image, Link2, FileText, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppShell } from "@/components/app-shell-context";

type CrackNavItem = {
  name: string;
  pageIndex: number;
  icon: LucideIcon;
};

const CRACK_NAV_ITEMS: CrackNavItem[] = [
  { name: "Audios", pageIndex: 1, icon: Mic },
  { name: "Imágenes", pageIndex: 2, icon: Image },
  { name: "Inicio", pageIndex: 3, icon: Home },
  { name: "Enlaces", pageIndex: 4, icon: Link2 },
  { name: "Notas", pageIndex: 5, icon: FileText },
];

export function TabBar() {
  const { pagerIndex, navigateToPage } = useAppShell();

  return (
    <nav
      className="tm-app-tabbar pointer-events-none flex h-[var(--tm-tabbar-core)] w-full shrink-0 items-center justify-around px-2 md:px-8"
      aria-label="Navegacion principal"
    >
      {CRACK_NAV_ITEMS.map((item) => {
        const active = pagerIndex === item.pageIndex;
        const Icon = item.icon;

        return (
          <button
            key={item.name}
            type="button"
            className={cn(
              "pointer-events-auto flex min-h-12 min-w-12 flex-1 items-end justify-center pb-1",
              "transition-[color,transform,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95",
              active ? "text-[var(--tm-accent)]" : "text-[var(--tm-muted)]"
            )}
            aria-current={active ? "page" : undefined}
            aria-label={item.name}
            onClick={() => navigateToPage(item.pageIndex)}
          >
            <Icon size={22} className="md:h-5 md:w-5" strokeWidth={2} />
          </button>
        );
      })}
    </nav>
  );
}
