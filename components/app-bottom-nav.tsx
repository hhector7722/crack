'use client';

import { useRef } from 'react';
import { Home, FileText, Images, Mic, User, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppShell } from '@/components/app-shell-context';

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

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-[95] flex',
        'min-h-[calc(5rem+env(safe-area-inset-bottom))] md:min-h-[calc(4rem+env(safe-area-inset-bottom))]',
        'items-center justify-around border-t border-zinc-800/80',
        'bg-zinc-950/90 px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]',
        'backdrop-blur-md md:px-8 print:hidden'
      )}
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
