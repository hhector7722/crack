"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, FileText, Images, Camera, Mic, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppShell } from "@/components/app-shell-context";
import { PAGER_PATHS } from "@/components/app-pager";

export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { openCamera, openCaptureMenu, pagerIndex, setPagerIndex } =
    useAppShell();

  const isNotes = pathname.startsWith("/notes");
  const isGallery = pathname.startsWith("/media");
  const isHome = pathname === "/";
  const isAudio = pathname.startsWith("/audio");

  function goToPage(index: number, path: string) {
    setPagerIndex(index);
    if (pathname !== path) {
      router.replace(path, { scroll: false });
    }
  }

  function goToGallery() {
    if (pathname !== "/media") {
      router.replace("/media", { scroll: false });
    }
  }

  return (
    <nav className="app-tabbar">
      <div className="flex flex-col items-center pb-1 pt-2">
        <button
          type="button"
          onClick={openCaptureMenu}
          aria-label="Crear"
          className="relative z-50 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-950 shadow-lg shadow-black/40 transition-transform active:scale-95"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>

        {!isGallery && (
          <div
            className="mt-2 flex items-center gap-1.5"
            role="tablist"
            aria-label="Páginas"
          >
            {PAGER_PATHS.map((path, i) => (
              <button
                key={path}
                type="button"
                role="tab"
                aria-selected={pagerIndex === i}
                aria-label={`Página ${i + 1}`}
                onClick={() => goToPage(i, path)}
                className={cn(
                  "h-1.5 rounded-full bg-white transition-all duration-300",
                  pagerIndex === i ? "w-4 opacity-100" : "w-1.5 opacity-35"
                )}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between px-1 pt-1 pb-1">
        <TabButton
          label="Notas"
          icon={FileText}
          active={isNotes}
          onClick={() => goToPage(0, "/notes")}
        />
        <TabButton
          label="Galería"
          icon={Images}
          active={isGallery}
          onClick={goToGallery}
        />
        <TabButton
          label="Inicio"
          icon={Home}
          active={isHome}
          onClick={() => goToPage(1, "/")}
        />
        <button
          type="button"
          onClick={openCamera}
          className="flex min-w-[56px] flex-1 flex-col-reverse items-center gap-0.5 rounded-lg pt-1 pb-1 text-xs leading-none text-zinc-500 transition-colors active:text-zinc-100"
        >
          <Camera className="h-5 w-5 shrink-0" strokeWidth={2} />
          <span className="font-medium">Cámara</span>
        </button>
        <TabButton
          label="Audio"
          icon={Mic}
          active={isAudio}
          onClick={() => goToPage(2, "/audio")}
        />
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
