"use client";

import { useLayoutEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Home, Library, Plus, Search } from "lucide-react";
import { useAppShell } from "@/components/app-shell-context";
import { useSearch } from "@/components/search-context";
import { cn } from "@/lib/utils";

export function BottomChrome() {
  const pathname = usePathname();
  const router = useRouter();
  const { openCaptureMenu } = useAppShell();
  const { toggleSearch } = useSearch();
  const searchRef = useRef<HTMLButtonElement>(null);

  const libraryActive =
    pathname === "/biblioteca" ||
    ["/notes", "/enlaces", "/media", "/audio", "/files"].some((path) =>
      pathname.startsWith(path)
    );

  useLayoutEffect(() => {
    const root = document.documentElement;

    const sync = () => {
      const search = searchRef.current;
      if (!search) return;

      const viewport = window.visualViewport;
      const viewportBottom = viewport
        ? viewport.offsetTop + viewport.height
        : window.innerHeight;
      const searchTop = search.getBoundingClientRect().top;
      const block = Math.max(0, Math.ceil(viewportBottom - searchTop));

      root.style.setProperty("--tm-bottom-chrome-block", block + "px");
    };

    sync();
    const frame = requestAnimationFrame(sync);
    const observer = new ResizeObserver(sync);

    if (searchRef.current) observer.observe(searchRef.current);

    window.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("scroll", sync);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
      root.style.removeProperty("--tm-bottom-chrome-block");
    };
  }, []);

  if (pathname === "/login" || pathname.startsWith("/auth")) {
    return null;
  }

  return (
    <div
      data-tm-bottom-chrome
      className="tm-bottom-chrome pointer-events-none fixed left-0 right-0 z-[95] flex flex-col bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-transparent px-3 pt-3"
      style={{ bottom: "var(--tm-chrome-bottom, 0px)" }}
    >
      <button
        ref={searchRef}
        type="button"
        onClick={toggleSearch}
        className="pointer-events-auto mb-1.5 flex h-11 w-full items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 text-left text-sm text-zinc-500 shadow-lg shadow-black/30 active:bg-zinc-800"
      >
        <Search className="h-5 w-5 shrink-0" />
        <span>Buscar cualquier cosa…</span>
      </button>

      <div className="pointer-events-auto overflow-hidden rounded-t-xl border border-b-0 border-zinc-800 bg-[#141416] shadow-xl shadow-black/50">
        <nav
          className="grid h-12 grid-cols-3 items-center px-1"
          aria-label="Navegación principal"
        >
          <button
            type="button"
            onClick={() => router.replace("/", { scroll: false })}
            aria-current={!libraryActive ? "page" : undefined}
            className={cn(
              "flex h-11 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-medium",
              !libraryActive ? "text-zinc-100" : "text-zinc-500"
            )}
          >
            <Home className="h-[18px] w-[18px]" />
            Inicio
          </button>

          <button
            type="button"
            onClick={openCaptureMenu}
            aria-label="Crear"
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-950 shadow-lg shadow-black/25 active:scale-95"
          >
            <Plus className="h-7 w-7" />
          </button>

          <button
            type="button"
            onClick={() => router.replace("/biblioteca", { scroll: false })}
            aria-current={libraryActive ? "page" : undefined}
            className={cn(
              "flex h-11 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-medium",
              libraryActive ? "text-zinc-100" : "text-zinc-500"
            )}
          >
            <Library className="h-[18px] w-[18px]" />
            Biblioteca
          </button>
        </nav>

        <div
          aria-hidden
          className="h-[env(safe-area-inset-bottom,0px)] bg-[#141416]"
        />
      </div>
    </div>
  );
}
