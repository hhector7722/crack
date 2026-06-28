"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useModalOpen } from "@/lib/ui/use-modal-open";
import { iosTransition, PANEL_SLIDE_MS } from "@/lib/ui/motion";

export type ModalPanelSlide = {
  direction: "next" | "prev";
  phase: "prep" | "animate";
  incoming: React.ReactNode;
  onTransitionEnd: () => void;
};

export interface AppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  /** Más ancho para formularios o detalle con mucho contenido */
  size?: "content" | "wide" | "fixed";
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  panelSlide?: ModalPanelSlide | null;
  belowPanel?: React.ReactNode;
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
  onSwipeLeft,
  onSwipeRight,
  panelSlide = null,
  belowPanel,
}: AppModalProps) {
  const [mounted, setMounted] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const swipeHandledRef = useRef(false);
  const hasSwipe = Boolean(onSwipeLeft || onSwipeRight);

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

  function onTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    if (panelSlide || !hasSwipe) return;
    swipeHandledRef.current = false;
    touchStartX.current = event.touches[0]?.clientX ?? null;
    touchStartY.current = event.touches[0]?.clientY ?? null;
  }

  function onTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (panelSlide || !hasSwipe) return;
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touch = event.changedTouches[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    touchStartX.current = null;
    touchStartY.current = null;

    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

    event.preventDefault();
    swipeHandledRef.current = true;

    if (deltaX < 0) {
      onSwipeLeft?.();
    } else {
      onSwipeRight?.();
    }
  }

  function onBackdropClick(event: React.MouseEvent<HTMLDivElement>) {
    if (swipeHandledRef.current) {
      swipeHandledRef.current = false;
      event.preventDefault();
      return;
    }
    onOpenChange(false);
  }

  const slideActive = panelSlide !== null;
  const slideNext = panelSlide?.direction === "next";
  const slideAnimate = panelSlide?.phase === "animate";
  const panelSlideTransition = iosTransition("transform", PANEL_SLIDE_MS);

  const cardClassName = cn(
    "crack-modal-card relative z-10 flex max-h-[calc(min(var(--tm-vv-height,100dvh),100dvh)-2*var(--app-gutter))] flex-col overflow-hidden rounded-2xl bg-zinc-800 shadow-sm shadow-black/40 outline-none w-full",
    size === "fixed"
      ? "h-[65vh] max-h-[500px]"
      : "",
    className
  );

  const renderContent = (content: React.ReactNode) => (
    <>
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
          "crack-modal-body flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4",
          title ? "pt-3" : "pt-4"
        )}
      >
        {content}
      </div>
    </>
  );

  return createPortal(
    <div
      className={cn(
        "crack-modal-root fixed inset-0 z-[999] flex flex-col items-center justify-center p-[var(--app-gutter)]",
        slideActive && "touch-none"
      )}
      data-block-tab-swipe
      onTouchStart={hasSwipe ? onTouchStart : undefined}
      onTouchEnd={hasSwipe ? onTouchEnd : undefined}
    >
      <div
        role="presentation"
        className="crack-modal-overlay absolute inset-0 w-full h-full cursor-default bg-black/15 backdrop-blur-[6px]"
        onClick={onBackdropClick}
      />
      <div
        className="relative z-10 flex w-full flex-col items-center justify-center pointer-events-none"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "crack-modal-title" : undefined}
          data-crack-modal
          data-block-tab-swipe
          className={cn(
            "pointer-events-auto overflow-hidden outline-none flex justify-center",
            size === "fixed"
              ? "w-[80vw] max-w-[400px]"
              : size === "wide"
              ? "w-full max-w-[min(32rem,calc(100vw-2*var(--app-gutter)))]"
              : "w-full max-w-[max-content]"
          )}
        >
          {slideActive && panelSlide ? (
            <div
              className="flex w-[200%]"
              style={{
                transform: slideNext
                  ? slideAnimate
                    ? "translateX(-50%)"
                    : "translateX(0)"
                  : slideAnimate
                    ? "translateX(0)"
                    : "translateX(-50%)",
                transition: slideAnimate ? panelSlideTransition : "none",
              }}
              onTransitionEnd={(event) => {
                if (event.target !== event.currentTarget) return;
                if (event.propertyName !== "transform") return;
                if (!slideAnimate) return;
                panelSlide.onTransitionEnd();
              }}
            >
              {slideNext ? (
                <>
                  <div className="w-1/2 shrink-0 pr-0 flex justify-center">
                    <div className={cardClassName}>
                      {renderContent(children)}
                    </div>
                  </div>
                  <div className="w-1/2 shrink-0 pl-0 flex justify-center">
                    <div className={cardClassName}>
                      {renderContent(panelSlide.incoming)}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-1/2 shrink-0 flex justify-center">
                    <div className={cardClassName}>
                      {renderContent(panelSlide.incoming)}
                    </div>
                  </div>
                  <div className="w-1/2 shrink-0 flex justify-center">
                    <div className={cardClassName}>
                      {renderContent(children)}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex justify-center w-full">
              <div className={cardClassName}>
                {renderContent(children)}
              </div>
            </div>
          )}
        </div>
        {belowPanel && <div className="pointer-events-auto w-full mt-3">{belowPanel}</div>}
      </div>
    </div>,
    document.body
  );
}
