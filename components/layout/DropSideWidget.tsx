"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const STORAGE_KEY = "drop-side-widget-top-ratio";
const WIDGET_HEIGHT = 56;
const DRAG_THRESHOLD = 6;

function readStoredRatio(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) return null;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0 || value > 1) return null;
    return value;
  } catch {
    return null;
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function getBounds() {
  const styles = getComputedStyle(document.documentElement);
  const headerBlock =
    parseFloat(styles.getPropertyValue("--tm-app-header-block")) || 88;
  const chromeBlock =
    parseFloat(styles.getPropertyValue("--tm-bottom-chrome-block")) || 112;
  const vvOffset =
    parseFloat(styles.getPropertyValue("--tm-vv-offset-top")) || 0;
  const minTop = vvOffset + headerBlock + 8;
  const maxTop = window.innerHeight - chromeBlock - WIDGET_HEIGHT - 8;
  return { minTop, maxTop: Math.max(minTop, maxTop) };
}

function topFromRatio(ratio: number | null) {
  const { minTop, maxTop } = getBounds();
  if (ratio == null) {
    // Default: justo por encima del chrome inferior (posición original).
    return maxTop;
  }
  return minTop + ratio * (maxTop - minTop);
}

function ratioFromTop(top: number) {
  const { minTop, maxTop } = getBounds();
  const span = maxTop - minTop;
  if (span <= 0) return 1;
  return clamp((top - minTop) / span, 0, 1);
}

export function DropSideWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const [top, setTop] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const topRef = useRef<number | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startY: number;
    startTop: number;
    moved: boolean;
  } | null>(null);
  const didDragRef = useRef(false);

  const syncPosition = useCallback(() => {
    if (dragRef.current?.moved) return;
    const next = topFromRatio(readStoredRatio());
    topRef.current = next;
    setTop(next);
  }, []);

  useEffect(() => {
    syncPosition();
    window.addEventListener("resize", syncPosition);
    return () => window.removeEventListener("resize", syncPosition);
  }, [syncPosition]);

  useEffect(() => {
    const observer = new ResizeObserver(() => syncPosition());
    const chrome = document.querySelector("[data-tm-bottom-chrome]");
    if (chrome) observer.observe(chrome);
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, [syncPosition]);

  if (
    pathname.startsWith("/drop") ||
    pathname === "/login" ||
    pathname.startsWith("/auth")
  ) {
    return null;
  }

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0 || topRef.current == null) return;
    didDragRef.current = false;
    dragRef.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      startTop: topRef.current,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    const deltaY = e.clientY - drag.startY;
    if (!drag.moved && Math.abs(deltaY) < DRAG_THRESHOLD) return;

    if (!drag.moved) {
      drag.moved = true;
      didDragRef.current = true;
      setDragging(true);
    }

    const { minTop, maxTop } = getBounds();
    const next = clamp(drag.startTop + deltaY, minTop, maxTop);
    topRef.current = next;
    setTop(next);
  }

  function endDrag(e: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    setDragging(false);

    if (drag.moved && topRef.current != null) {
      const ratio = ratioFromTop(topRef.current);
      try {
        localStorage.setItem(STORAGE_KEY, String(ratio));
      } catch {
        // ignore
      }
      const snapped = topFromRatio(ratio);
      topRef.current = snapped;
      setTop(snapped);
    }

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  function onClick() {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    router.push("/drop");
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      aria-label="Abrir Drop"
      className="pointer-events-auto fixed right-0 z-[96] flex h-14 min-h-12 w-[3.5rem] shrink-0 touch-none items-center justify-center overflow-hidden rounded-l-2xl rounded-r-none bg-zinc-950 shadow-[-6px_6px_20px_rgba(0,0,0,0.45),-2px_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(212,175,55,0.12)] ring-1 ring-inset ring-amber-500/25 transition-[transform,box-shadow,width] duration-300 ease-out hover:w-[3.75rem] hover:-translate-x-1 hover:shadow-[-10px_8px_28px_rgba(0,0,0,0.5),-3px_3px_10px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(212,175,55,0.18)] active:translate-x-0 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
      style={{
        top: top ?? undefined,
        bottom:
          top == null
            ? "max(calc(var(--tm-bottom-chrome-block, 7rem) + 1rem), calc(env(safe-area-inset-bottom, 0px) + 5.5rem))"
            : undefined,
        transition: dragging ? "width 300ms ease-out, box-shadow 300ms ease-out, transform 300ms ease-out" : undefined,
      }}
    >
      <img
        src="/icons/drop-widget-icon.png"
        alt=""
        width={44}
        height={44}
        className="h-11 w-11 -translate-x-0.5 object-cover"
        aria-hidden
      />
    </button>
  );
}
