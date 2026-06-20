"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, FileText, Images, Mic, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppShell } from "@/components/app-shell-context";
import {
  ALL_PAGER_PATHS,
  PAGER_DOT_INDICES,
  PAGER_PATHS,
} from "@/components/app-pager";

export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { openCaptureMenu, pagerIndex, setPagerIndex } = useAppShell();

  function goToPage(index: number, path: string) {
    setPagerIndex(index);
    if (pathname !== path) {
      router.replace(path, { scroll: false });
    }
  }

  return (
    <nav className="app-tabbar" aria-label="Navegación principal">
      <div className="mx-auto flex w-full max-w-[430px] flex-col">
        <div className="flex flex-col items-center pt-2">
          <button
            type="button"
            onClick={openCaptureMenu}
            aria-label="Crear"
            className="relative z-50 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-950 shadow-lg shadow-black/40 transition-transform active:scale-95"
          >
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </button>

          <div
            className="mt-2 flex items-center gap-1.5"
            role="tablist"
            aria-label="Páginas centrales"
          >
            {PAGER_PATHS.map((path, dotIndex) => {
              const pageIndex = PAGER_DOT_INDICES[dotIndex];
              const active = pagerIndex === pageIndex;
              return (
                <button
                  key={path}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={`Página ${dotIndex + 1}`}
                  onClick={() => goToPage(pageIndex, path)}
                  className={cn(
                    "h-1.5 rounded-full bg-white transition-all duration-300",
                    active ? "w-4 opacity-100" : "w-1.5 opacity-35"
                  )}
                />
              );
            })}
          </div>
        </div>

        <div className="flex items-end justify-between px-1 pt-1 pb-1">
          <TabButton
            label="Audio"
            icon={Mic}
            active={pathname.startsWith("/audio")}
            onClick={() => goToPage(0, ALL_PAGER_PATHS[0])}
          />
          <TabButton
            label="Galería"
            icon={Images}
            active={pathname.startsWith("/media")}
            onClick={() => goToPage(1, ALL_PAGER_PATHS[1])}
          />
          <TabButton
            label="Inicio"
            icon={Home}
            active={pathname === "/"}
            onClick={() => goToPage(2, ALL_PAGER_PATHS[2])}
          />
          <TabButton
            label="Notas"
            icon={FileText}
            active={pathname.startsWith("/notes")}
            onClick={() => goToPage(3, ALL_PAGER_PATHS[3])}
          />
          <TabButton
            label="Perfil"
            icon={User}
            active={pathname.startsWith("/profile")}
            onClick={() => goToPage(4, ALL_PAGER_PATHS[4])}
          />
        </div>
      </div>
    </nav>
  );
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
