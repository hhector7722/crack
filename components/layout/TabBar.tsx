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

const TABBAR_NAV_CLASS =
  "tm-app-tabbar fixed bottom-0 left-0 right-0 z-[95] flex h-[var(--tm-tabbar-core)] items-center justify-around bg-[var(--tm-tabbar-bg-hex)] px-2 pb-safe md:px-8";

export function TabBar() {
  const { pagerIndex, navigateToPage } = useAppShell();

  return (
    <nav className={TABBAR_NAV_CLASS} aria-label="Navegacion principal">
      {CRACK_NAV_ITEMS.map((item) => {
        const active = pagerIndex === item.pageIndex;
        const Icon = item.icon;

        return (
          <button
            key={item.name}
            type="button"
            className={cn(
              "flex min-h-12 min-w-12 flex-1 flex-col items-center justify-center",
              "transition-[color,transform,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95",
              active ? "text-[var(--tm-accent)] drop-shadow-md" : "text-[var(--tm-muted)]"
            )}
            aria-current={active ? "page" : undefined}
            aria-label={item.name}
            onClick={() => navigateToPage(item.pageIndex)}
          >
            <Icon size={20} className="md:h-5 md:w-5" strokeWidth={2.5} />
            <span className="mt-0.5 text-[7.5px] font-black uppercase tracking-tighter whitespace-nowrap md:mt-1 md:text-[9px] md:tracking-widest">
              {item.name}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
