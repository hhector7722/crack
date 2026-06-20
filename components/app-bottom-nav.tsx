'use client';

import { useRef } from 'react';
import { Home, FileText, Images, Mic, User, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppShell } from '@/components/app-shell-context';
import { useVisualViewportBottomPin } from '@/lib/ui/use-visual-viewport-bottom-pin';

type CrackNavItem = {
  name: string;
  pageIndex: number;
  icon: LucideIcon;
};

const CRACK_NAV_ITEMS: CrackNavItem[] = [
  { name: 'Audio', pageIndex: 0, icon: Mic },
  { name: 'Galería', pageIndex: 1, icon: Images },
  { name: 'Inicio', pageIndex: 2, icon: Home },
  { name: 'Notas', pageIndex: 3, icon: FileText },
  { name: 'Perfil', pageIndex: 4, icon: User },
];

export function AppBottomNav() {
  const { pagerIndex, navigateToPage } = useAppShell();
  const navRef = useRef<HTMLElement>(null);

  useVisualViewportBottomPin(navRef);

  return (
    <nav
      ref={navRef}
      className="app-chrome-bar marbella-fixed-bottombar fixed bottom-0 z-[95] justify-around print:hidden"
      aria-label="Navegación principal"
    >
      {CRACK_NAV_ITEMS.map((item) => {
        const active = pagerIndex === item.pageIndex;
        const Icon = item.icon;

        return (
          <button
            key={item.name}
            type="button"
            className={cn(
              'flex min-h-12 min-w-12 flex-1 flex-col items-center justify-center transition-all duration-200 active:scale-95',
              active
                ? 'scale-110 text-zinc-100 drop-shadow-md'
                : 'text-zinc-500 hover:text-zinc-300'
            )}
            aria-current={active ? 'page' : undefined}
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
