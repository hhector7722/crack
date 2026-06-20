"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

interface SwipePagerProps {
  index: number;
  onIndexChange: (index: number) => void;
  children: ReactNode[];
  className?: string;
}

const SWIPE_THRESHOLD = 0.22;
const VELOCITY_THRESHOLD = 0.38;
const MIN_DRAG_PX = 36;
const TRANSITION_MS = 320;
const EASING = "cubic-bezier(0.32, 0.72, 0, 1)";

function rubberBand(offset: number, width: number): number {
  const abs = Math.abs(offset);
  const limit = width * 0.75;
  const sign = offset >= 0 ? 1 : -1;
  return sign * (limit * (1 - 1 / (abs / limit + 1)));
}

export function SwipePager({
  index,
  onIndexChange,
  children,
  className,
}: SwipePagerProps) {
  const count = children.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [animating, setAnimating] = useState(false);

  const dragOffset = useRef(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const velocity = useRef(0);
  const locked = useRef<"none" | "horizontal" | "vertical">("none");
  const indexRef = useRef(index);
  const pointerIdRef = useRef<number | null>(null);
  const animTimerRef = useRef(0);

  const applyTransform = useCallback(
    (offsetPx: number, animate: boolean) => {
      const track = trackRef.current;
      if (!track || width === 0) return;
      const base = -indexRef.current * width;
      track.style.transition = animate
        ? `transform ${TRANSITION_MS}ms ${EASING}`
        : "none";
      track.style.transform = `translate3d(${base + offsetPx}px, 0, 0)`;
    },
    [width]
  );

  useEffect(() => {
    indexRef.current = index;
    if (!dragging && !animating) {
      applyTransform(0, true);
    }
  }, [index, dragging, animating, applyTransform]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!dragging && !animating) {
      applyTransform(0, true);
    }
  }, [width, dragging, animating, applyTransform]);

  useEffect(() => {
    return () => window.clearTimeout(animTimerRef.current);
  }, []);

  function clampIndex(i: number) {
    return Math.max(0, Math.min(count - 1, i));
  }

  function resolveTarget(offset: number, vel: number): number {
    const current = indexRef.current;

    if (Math.abs(vel) > VELOCITY_THRESHOLD) {
      if (vel > 0 && offset >= 0) return clampIndex(current - 1);
      if (vel < 0 && offset <= 0) return clampIndex(current + 1);
    }

    if (Math.abs(offset) < MIN_DRAG_PX) {
      return current;
    }

    const progress = width > 0 ? -offset / width : 0;
    if (progress > SWIPE_THRESHOLD) {
      return clampIndex(current - 1);
    }
    if (progress < -SWIPE_THRESHOLD) {
      return clampIndex(current + 1);
    }

    return current;
  }

  function resetGesture() {
    setDragging(false);
    locked.current = "none";
    dragOffset.current = 0;
    pointerIdRef.current = null;
  }

  function onPointerDown(e: React.PointerEvent) {
    if (width === 0 || e.button !== 0) return;

    window.clearTimeout(animTimerRef.current);
    setAnimating(false);

    locked.current = "none";
    dragOffset.current = 0;
    startX.current = e.clientX;
    startY.current = e.clientY;
    lastX.current = e.clientX;
    lastTime.current = performance.now();
    velocity.current = 0;
    pointerIdRef.current = e.pointerId;
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging || pointerIdRef.current !== e.pointerId || width === 0) return;

    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    if (locked.current === "none") {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.05) {
        resetGesture();
        return;
      }
      locked.current = "horizontal";
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }

    if (locked.current !== "horizontal") return;

    e.preventDefault();

    const now = performance.now();
    const dt = now - lastTime.current;
    if (dt > 0) {
      const instant = (e.clientX - lastX.current) / dt;
      velocity.current = velocity.current * 0.65 + instant * 0.35;
    }
    lastX.current = e.clientX;
    lastTime.current = now;

    const current = indexRef.current;
    const atStart = current === 0 && dx > 0;
    const atEnd = current === count - 1 && dx < 0;
    const offset = atStart || atEnd ? rubberBand(dx, width) : dx;

    dragOffset.current = offset;
    applyTransform(offset, false);
  }

  function finishGesture(e: React.PointerEvent) {
    if (!dragging || pointerIdRef.current !== e.pointerId) return;

    if (locked.current === "horizontal") {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      const target = resolveTarget(dragOffset.current, velocity.current);
      dragOffset.current = 0;

      if (target !== indexRef.current) {
        setAnimating(true);
        indexRef.current = target;
        onIndexChange(target);
        applyTransform(0, true);
        animTimerRef.current = window.setTimeout(
          () => setAnimating(false),
          TRANSITION_MS + 24
        );
      } else {
        applyTransform(0, true);
      }
    }

    resetGesture();
  }

  return (
    <div
      ref={containerRef}
      className={cn("h-full w-full overflow-hidden", className)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finishGesture}
      onPointerCancel={finishGesture}
      style={{ touchAction: "pan-y pinch-zoom" }}
    >
      <div
        ref={trackRef}
        className="flex h-full will-change-transform"
        style={{ width: width > 0 ? width * count : `${count * 100}%` }}
      >
        {children.map((child, i) => (
          <div
            key={i}
            className="h-full shrink-0 overflow-hidden"
            style={{ width: width > 0 ? width : `${100 / count}%` }}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
