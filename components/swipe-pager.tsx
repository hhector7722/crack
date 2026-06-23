"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { IOS_EASE_OUT, PAGE_PUSH_MS } from "@/lib/ui/motion";

interface SwipePagerProps {
  index: number;
  onIndexChange: (index: number) => void;
  children: ReactNode[];
  className?: string;
}

const SWIPE_THRESHOLD = 0.22;
const VELOCITY_THRESHOLD = 0.38;
const MIN_DRAG_PX = 36;

function rubberBand(offset: number, width: number): number {
  const abs = Math.abs(offset);
  const limit = width * 0.75;
  const sign = offset >= 0 ? 1 : -1;
  return sign * (limit * (1 - 1 / (abs / limit + 1)));
}

function setSwipeDragging(active: boolean) {
  if (typeof document === "undefined") return;
  if (active) {
    document.documentElement.setAttribute("data-tab-swipe-dragging", "");
  } else {
    document.documentElement.removeAttribute("data-tab-swipe-dragging");
  }
}

function setSwipeNavigating(active: boolean) {
  if (typeof document === "undefined") return;
  if (active) {
    document.documentElement.setAttribute("data-tab-swipe-navigating", "");
  } else {
    document.documentElement.removeAttribute("data-tab-swipe-navigating");
  }
}

function isModalOpen() {
  return (
    typeof document !== "undefined" &&
    document.documentElement.hasAttribute("data-modal-open")
  );
}

function canStartSwipe(target: EventTarget | null) {
  if (!(target instanceof Element)) return true;
  if (target.closest("[data-block-tab-swipe]")) return false;
  if (
    target.closest(
      "input, textarea, select, button, a, [role='slider'], [data-crack-modal], [data-block-tab-swipe]"
    )
  ) {
    return false;
  }
  return true;
}

function panelDepthTransform(
  panelIndex: number,
  activeIndex: number,
  dragOffset: number,
  width: number,
  animating: boolean
): string | undefined {
  if (width <= 0) return undefined;
  const progress = dragOffset / width;
  const distance = Math.abs(panelIndex - activeIndex - progress);
  if (distance > 1.05 && !animating) return undefined;
  const scale = 1 - Math.min(distance, 1) * 0.035;
  return scale < 0.999 ? `scale(${scale})` : undefined;
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
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [commitFrom, setCommitFrom] = useState<number | null>(null);

  const dragOffset = useRef(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const velocity = useRef(0);
  const locked = useRef<"none" | "horizontal" | "vertical">("none");
  const indexRef = useRef(index);
  const pointerIdRef = useRef<number | null>(null);
  const animatingRef = useRef(false);

  const slideTransition = `transform ${PAGE_PUSH_MS}ms ${IOS_EASE_OUT}`;
  const depthTransition = `transform ${PAGE_PUSH_MS}ms ${IOS_EASE_OUT}`;

  const applyTransform = useCallback(
    (offsetPx: number, animate: boolean) => {
      const track = trackRef.current;
      if (!track || width === 0) return;
      const base = -indexRef.current * width;
      track.style.transition = animate ? slideTransition : "none";
      track.style.transform = `translate3d(${base + offsetPx}px, 0, 0)`;
    },
    [slideTransition, width]
  );

  const syncDragOffset = useCallback((next: number) => {
    dragOffset.current = next;
    setDragOffsetPx(next);
  }, []);

  const finishAnimation = useCallback(() => {
    setAnimating(false);
    animatingRef.current = false;
    setCommitFrom(null);
    setSwipeNavigating(false);
  }, []);

  useEffect(() => {
    indexRef.current = index;
    if (!dragging && !animatingRef.current) {
      applyTransform(0, true);
    }
  }, [index, dragging, applyTransform]);

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
    if (!dragging && !animatingRef.current) {
      applyTransform(0, true);
    }
  }, [width, dragging, applyTransform]);

  useEffect(() => {
    setSwipeDragging(dragging);
    return () => setSwipeDragging(false);
  }, [dragging]);

  useEffect(() => {
    return () => {
      setSwipeNavigating(false);
      setSwipeDragging(false);
    };
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
    syncDragOffset(0);
    pointerIdRef.current = null;
  }

  function onPointerDown(e: React.PointerEvent) {
    if (width === 0 || e.button !== 0 || isModalOpen()) return;
    if (!canStartSwipe(e.target)) return;

    setAnimating(false);
    animatingRef.current = false;
    setCommitFrom(null);
    setSwipeNavigating(false);

    locked.current = "none";
    syncDragOffset(0);
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

    syncDragOffset(offset);
    applyTransform(offset, false);
  }

  function animateToRest(onDone?: () => void) {
    const track = trackRef.current;
    if (!track) {
      onDone?.();
      return;
    }

    setAnimating(true);
    animatingRef.current = true;
    applyTransform(0, true);

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      track.removeEventListener("transitionend", handleEnd);
      window.clearTimeout(fallbackTimer);
      syncDragOffset(0);
      finishAnimation();
      onDone?.();
    };

    const handleEnd = (event: TransitionEvent) => {
      if (event.target !== track || event.propertyName !== "transform") return;
      finish();
    };

    const fallbackTimer = window.setTimeout(finish, PAGE_PUSH_MS + 80);
    track.addEventListener("transitionend", handleEnd);
  }

  function finishGesture(e: React.PointerEvent) {
    if (!dragging || pointerIdRef.current !== e.pointerId) return;

    if (locked.current === "horizontal") {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      const fromIndex = indexRef.current;
      const target = resolveTarget(dragOffset.current, velocity.current);

      if (target !== fromIndex) {
        setCommitFrom(fromIndex);
        setSwipeNavigating(true);
        indexRef.current = target;
        onIndexChange(target);
        animateToRest();
      } else {
        animateToRest();
      }
    }

    resetGesture();
  }

  const visualActiveIndex =
    dragging || animating ? indexRef.current : index;

  return (
    <div
      ref={containerRef}
      className={cn(
        "swipe-pager-root tm-tab-swipe-root relative w-full overflow-x-hidden",
        dragging && "tm-tab-swipe-root--dragging swipe-pager-root--dragging",
        className
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finishGesture}
      onPointerCancel={finishGesture}
      style={{ touchAction: "pan-y pinch-zoom" }}
    >
      <div
        ref={trackRef}
        className="swipe-pager-track flex will-change-transform"
        style={{ width: width > 0 ? width * count : `${count * 100}%` }}
      >
        {children.map((child, i) => {
          const depth = panelDepthTransform(
            i,
            visualActiveIndex,
            dragOffsetPx,
            width,
            animating
          );
          const isOutgoing = commitFrom === i && animating;
          const isIncoming =
            commitFrom != null && i === indexRef.current && animating;

          return (
            <div
              key={i}
              className={cn(
                "swipe-pager-panel shrink-0 overflow-x-hidden",
                isOutgoing && "swipe-pager-panel--outgoing",
                isIncoming && "swipe-pager-panel--incoming"
              )}
              style={{
                width: width > 0 ? width : `${100 / count}%`,
                transform: depth,
                transition:
                  dragging || !animating ? "none" : depthTransition,
              }}
            >
              {child}
            </div>
          );
        })}
      </div>
    </div>
  );
}
