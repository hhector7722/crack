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
const VELOCITY_THRESHOLD = 0.35;
const TRANSITION_MS = 380;
const EASING = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";

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

  indexRef.current = index;

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
  }, [index, width, dragging, animating, applyTransform]);

  function clampIndex(i: number) {
    return Math.max(0, Math.min(count - 1, i));
  }

  function resolveTarget(offset: number, vel: number): number {
    const current = indexRef.current;
    const progress = width > 0 ? -offset / width : 0;

    if (vel > VELOCITY_THRESHOLD) {
      return clampIndex(current - 1);
    }
    if (vel < -VELOCITY_THRESHOLD) {
      return clampIndex(current + 1);
    }
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
    if (animating || width === 0 || e.button !== 0) return;
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
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      locked.current =
        Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
      if (locked.current === "vertical") {
        resetGesture();
        return;
      }
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }

    if (locked.current !== "horizontal") return;

    e.preventDefault();

    const now = performance.now();
    const dt = now - lastTime.current;
    if (dt > 0) {
      velocity.current = (e.clientX - lastX.current) / dt;
    }
    lastX.current = e.clientX;
    lastTime.current = now;

    let offset = dx;
    const current = indexRef.current;
    if ((current === 0 && offset > 0) || (current === count - 1 && offset < 0)) {
      offset *= 0.3;
    }

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
        window.setTimeout(() => setAnimating(false), TRANSITION_MS);
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
            className="app-pager-panel h-full shrink-0 overflow-y-auto overscroll-y-contain"
            style={{ width: width > 0 ? width : `${100 / count}%` }}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
