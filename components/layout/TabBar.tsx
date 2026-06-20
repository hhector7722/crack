"use client";

import { Home, FileText, Images, Mic, User, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppShell } from "@/components/app-shell-context";

type CrackNavItem = {
  name: string;
  pageIndex: number;
  icon: LucideIcon;
};

const CRACK_NAV_ITEMS: CrackNavItem[] = [
  { name: "Audio", pageIndex: 0, icon: Mic },
  { name: "Galería", pageIndex: 1, icon: Images },
  { name: "Inicio", pageIndex: 2, icon: Home },
  { name: "Notas", pageIndex: 3, icon: FileText },
  { name: "Perfil", pageIndex: 4, icon: User },
];

export function TabBar() {
  const { pagerIndex, navigateToPage } = useAppShell();

  return (
    <nav
      className="tm-app-tabbar flex h-[var(--tm-tabbar-core)] w-full shrink-0 items-center justify-around px-2 md:px-8"
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
              "flex min-h-12 min-w-12 flex-1 items-center justify-center",
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
