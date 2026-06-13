"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, Images, Camera, Mic, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppShell } from "@/components/app-shell-context";

export function TabBar() {
  const pathname = usePathname();
  const { openCamera, openCaptureMenu } = useAppShell();

  const isNotes = pathname.startsWith("/notes");
  const isGallery = pathname.startsWith("/media");
  const isHome = pathname === "/";
  const isAudio = pathname.startsWith("/audio");

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-lg">
      <div
        className="flex items-end justify-between px-1 pt-6"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        <TabLink href="/notes" label="Notas" icon={FileText} active={isNotes} />
        <TabLink href="/media" label="Galería" icon={Images} active={isGallery} />

        <div className="relative flex min-h-12 min-w-[56px] flex-1 flex-col items-center justify-end">
          <button
            type="button"
            onClick={openCaptureMenu}
            aria-label="Crear"
            className="absolute -top-3 left-1/2 z-50 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-zinc-100 text-zinc-950 shadow-lg shadow-black/40 transition-transform active:scale-95"
          >
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </button>
          <TabLink href="/" label="Inicio" icon={Home} active={isHome} center />
        </div>

        <button
          type="button"
          onClick={openCamera}
          className="flex min-h-12 min-w-[56px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg text-xs text-zinc-500 transition-colors active:text-zinc-100"
        >
          <Camera className="h-5 w-5" strokeWidth={2} />
          <span className="font-medium">Cámara</span>
        </button>
        <TabLink href="/audio" label="Audio" icon={Mic} active={isAudio} />
      </div>
    </nav>
  );
}

function TabLink({
  href,
  label,
  icon: Icon,
  active,
  center,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  active: boolean;
  center?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-12 min-w-[56px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg text-xs transition-colors",
        active ? "text-zinc-100" : "text-zinc-500"
      )}
    >
      <Icon
        className={cn("h-5 w-5", center && "h-6 w-6")}
        strokeWidth={active ? 2.5 : 2}
      />
      <span className={cn("font-medium", center && active && "font-semibold")}>
        {label}
      </span>
    </Link>
  );
}
