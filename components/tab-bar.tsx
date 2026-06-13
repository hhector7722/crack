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
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 bg-zinc-950/95 backdrop-blur-lg">
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={openCaptureMenu}
          aria-label="Crear"
          className="relative z-50 mb-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-950 shadow-lg shadow-black/40 transition-transform active:scale-95"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>

        <div
          className="w-full border-t border-zinc-800"
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        >
          <div className="flex items-stretch justify-between px-1 pt-1">
            <TabLink
              href="/notes"
              label="Notas"
              icon={FileText}
              active={isNotes}
            />
            <TabLink
              href="/media"
              label="Galería"
              icon={Images}
              active={isGallery}
            />
            <TabLink href="/" label="Inicio" icon={Home} active={isHome} />
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
        </div>
      </div>
    </nav>
  );
}

function TabLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-12 min-w-[56px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg text-xs transition-colors",
        active ? "text-zinc-100" : "text-zinc-500"
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
      <span className="font-medium">{label}</span>
    </Link>
  );
}
