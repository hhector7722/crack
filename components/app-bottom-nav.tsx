'use client';

import { useEffect, useRef } from 'react';
import { Home, FileText, Images, Mic, User, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppShell } from '@/components/app-shell-context';
import { PAGE_PUSH_MS, IOS_EASE_OUT } from '@/lib/ui/motion';
import { useVisualViewportBottomPin } from '@/lib/ui/use-visual-viewport-bottom-pin';
import {
  PAGER_DOT_INDICES,
  PAGER_PATHS,
  pagerIndexToDotIndex,
} from '@/lib/pager-routes';

export function AppBottomNav() {
  const { openCaptureMenu, pagerIndex, navigateToPage } = useAppShell();
  const anchorRef = useRef<HTMLDivElement>(null);

  useVisualViewportBottomPin(anchorRef, true);

  useEffect(() => {
    const node = anchorRef.current;
    if (!node) return;

    const syncHeight = () => {
      document.documentElement.style.setProperty(
        '--tabbar-height',
        `${node.getBoundingClientRect().height}px`
      );
    };

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(node);
    window.addEventListener('resize', syncHeight);
    window.visualViewport?.addEventListener('resize', syncHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncHeight);
      window.visualViewport?.removeEventListener('resize', syncHeight);
    };
  }, []);

  return (
    <div
      ref={anchorRef}
      className="app-fixed-bottombar fixed bottom-0 left-0 right-0 z-[95] mx-auto flex w-full max-w-[430px] flex-col print:hidden"
      style={{
        paddingLeft: 'max(0.5rem, env(safe-area-inset-left))',
        paddingRight: 'max(0.5rem, env(safe-area-inset-right))',
      }}
    >
      <div className="flex w-full flex-col items-center pt-1">
        <button
          type="button"
          onClick={openCaptureMenu}
          aria-label="Crear"
          className="relative z-50 flex h-12 min-h-12 w-12 min-w-12 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-950 shadow-lg shadow-black/40 transition-transform active:scale-95"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>

        <div
          className="mt-1.5 flex h-1.5 min-h-1.5 items-center gap-1.5"
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
                  'h-1.5 shrink-0 rounded-full bg-white opacity-50',
                  active ? 'w-4 opacity-100' : 'w-1.5'
                )}
                style={{
                  transition: `width ${PAGE_PUSH_MS}ms ${IOS_EASE_OUT}, opacity ${PAGE_PUSH_MS}ms ${IOS_EASE_OUT}`,
                }}
              />
            );
          })}
        </div>
      </div>

      <nav
        className="mt-1 w-full shrink-0 border-t border-zinc-800/50 bg-zinc-950/95 pb-safe backdrop-blur-md"
        aria-label="Navegación principal"
      >
        <div className="flex w-full items-end justify-between px-0.5">
          <NavTab
            label="Audio"
            icon={Mic}
            active={pagerIndex === 0}
            onClick={() => navigateToPage(0)}
          />
          <NavTab
            label="Galería"
            icon={Images}
            active={pagerIndex === 1}
            onClick={() => navigateToPage(1)}
          />
          <NavTab
            label="Inicio"
            icon={Home}
            active={pagerIndex === 2}
            onClick={() => navigateToPage(2)}
          />
          <NavTab
            label="Notas"
            icon={FileText}
            active={pagerIndex === 3}
            onClick={() => navigateToPage(3)}
          />
          <NavTab
            label="Perfil"
            icon={User}
            active={pagerIndex === 4}
            onClick={() => navigateToPage(4)}
          />
        </div>
      </nav>
    </div>
  );
}

function NavTab({
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
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-h-12 min-w-12 flex-1 flex-col-reverse items-center justify-end gap-0 py-0.5 text-[11px] leading-none transition-colors',
        active ? 'text-zinc-100' : 'text-zinc-500'
      )}
    >
      <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
      <span className="font-medium">{label}</span>
    </button>
  );
}
