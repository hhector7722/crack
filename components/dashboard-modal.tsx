"use client";

import { Search, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useModalOpen } from "@/lib/ui/use-modal-open";
import { useSearch } from "@/components/search-context";

interface DashboardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function DashboardModal({
  open,
  onOpenChange,
  children,
}: DashboardModalProps) {
  const [mounted, setMounted] = useState(false);
  const { setSearchOpen } = useSearch();

  useModalOpen(open);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  if (!mounted || !open) return null;

  function handleSearchOpen() {
    onOpenChange(false);
    setTimeout(() => setSearchOpen(true), 100);
  }

  return createPortal(
    <div className="fixed inset-0 z-[999] flex flex-col bg-[var(--tm-bg)]">
      <header className="flex items-center justify-between gap-3 px-4 pb-2 pt-12 shrink-0">
        <button
          type="button"
          onClick={handleSearchOpen}
          aria-label="Buscar"
          className="flex h-9 flex-1 items-center gap-2 rounded-xl bg-zinc-900 px-3 text-sm text-zinc-500 ring-1 ring-zinc-800 transition-colors active:text-zinc-300"
        >
          <Search className="h-4 w-4" />
          <span>Buscar en Crack...</span>
        </button>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="Cerrar"
          className="flex h-8 w-8 shrink-0 items-center justify-center text-zinc-400 transition-colors active:text-zinc-100"
        >
          <X className="h-5 w-5" />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8">
        {children}
      </div>
    </div>,
    document.body
  );
}
