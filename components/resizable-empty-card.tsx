"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "crack-home-empty-card-height";
const DEFAULT_HEIGHT = 120;
const MIN_HEIGHT = 72;
const MAX_HEIGHT = 520;
const LONG_PRESS_MS = 450;

function clampHeight(value: number) {
  return Math.round(Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, value)));
}

function readStoredHeight(): number {
  if (typeof window === "undefined") return DEFAULT_HEIGHT;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return DEFAULT_HEIGHT;
  const n = Number(stored);
  if (!Number.isFinite(n)) return DEFAULT_HEIGHT;
  return clampHeight(n);
}

export function ResizableEmptyCard() {
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [resizing, setResizing] = useState(false);
  const [ready, setReady] = useState(false);

  const startHeight = useRef(DEFAULT_HEIGHT);
  const startY = useRef(0);
  const longPressTimer = useRef(0);
  const resizingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    setHeight(readStoredHeight());
    setReady(true);
  }, []);

  const clearLongPress = useCallback(() => {
    window.clearTimeout(longPressTimer.current);
  }, []);

  const finishResize = useCallback(
    (nextHeight: number) => {
      const clamped = clampHeight(nextHeight);
      setHeight(clamped);
      localStorage.setItem(STORAGE_KEY, String(clamped));
      resizingRef.current = false;
      setResizing(false);
      pointerIdRef.current = null;
    },
    []
  );

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    clearLongPress();
    const el = e.currentTarget;
    const pointerId = e.pointerId;
    pointerIdRef.current = pointerId;
    startY.current = e.clientY;
    startHeight.current = height;

    longPressTimer.current = window.setTimeout(() => {
      resizingRef.current = true;
      setResizing(true);
      el.setPointerCapture(pointerId);
    }, LONG_PRESS_MS);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (pointerIdRef.current !== e.pointerId) return;

    if (resizingRef.current) {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.clientY - startY.current;
      setHeight(clampHeight(startHeight.current + delta));
      return;
    }

    if (Math.abs(e.clientY - startY.current) > 12) {
      clearLongPress();
    }
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (pointerIdRef.current !== e.pointerId) return;
    clearLongPress();

    if (resizingRef.current) {
      e.preventDefault();
      e.stopPropagation();
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      const delta = e.clientY - startY.current;
      finishResize(startHeight.current + delta);
      return;
    }

    pointerIdRef.current = null;
  }

  function onPointerCancel(e: React.PointerEvent<HTMLDivElement>) {
    clearLongPress();
    if (resizingRef.current) {
      const delta = e.clientY - startY.current;
      finishResize(startHeight.current + delta);
    } else {
      pointerIdRef.current = null;
    }
  }

  return (
    <section
      aria-label="Espacio personalizable"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      style={{
        height: ready ? height : DEFAULT_HEIGHT,
        touchAction: resizing ? "none" : "pan-y",
      }}
      className={cn(
        "relative shrink-0",
        resizing && "outline outline-1 outline-dashed outline-zinc-700/60"
      )}
    >
      {resizing && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          <span className="text-xs font-medium text-zinc-500">
            Desliza para ajustar altura
          </span>
        </div>
      )}
    </section>
  );
}
