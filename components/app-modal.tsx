"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useModalOpen } from "@/lib/ui/use-modal-open";

export interface AppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  /** Más ancho para formularios o detalle con mucho contenido */
  size?: "content" | "wide";
}

/**
 * Modal estándar de Crack. Obligatorio para cualquier overlay/diálogo nuevo.
 * Card zinc-800, fondo difuminado, tamaño según contenido, máx. viewport visible.
 */
export function AppModal({
  open,
  onOpenChange,
  title,
  children,
  className,
  size = "content",
}: AppModalProps) {
  const [mounted, setMounted] = useState(false);

  useModalOpen(open);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="crack-modal-root fixed inset-0 z-[999] flex items-center justify-center p-[var(--app-gutter)]"
      data-block-tab-swipe
    >
      <button
        type="button"
        aria-label="Cerrar"
        className="crack-modal-overlay absolute inset-0 bg-black/35 backdrop-blur-[6px]"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "crack-modal-title" : undefined}
        data-crack-modal
        data-block-tab-swipe
        className={cn(
          "crack-modal-card relative z-10 flex max-h-[calc(min(var(--tm-vv-height,100dvh),100dvh)-2*var(--app-gutter))] flex-col overflow-hidden rounded-2xl bg-zinc-800 shadow-sm shadow-black/40 outline-none",
          size === "wide"
            ? "w-full max-w-[min(32rem,calc(100vw-2*var(--app-gutter)))]"
            : "w-max max-w-[calc(100vw-2*var(--app-gutter))]",
          className
        )}
      >
        {title ? (
          <h2
            id="crack-modal-title"
            className="shrink-0 px-4 pt-4 text-lg font-semibold text-zinc-100"
          >
            {title}
          </h2>
        ) : null}
        <div
          className={cn(
            "crack-modal-body min-h-0 overflow-y-auto overscroll-contain px-4 pb-4",
            title ? "pt-3" : "pt-4"
          )}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
