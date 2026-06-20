"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
}

const PULL_THRESHOLD = 72;

export function PullToRefresh({
  onRefresh,
  children,
  className,
}: PullToRefreshProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const pullRef = useRef(0);

  async function triggerRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    setPull(48);
    pullRef.current = 48;
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
      setPull(0);
      pullRef.current = 0;
    }
  }

  function onTouchStart(e: React.TouchEvent) {
    const el = scrollRef.current;
    if (!el || refreshing) return;
    if (el.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!pulling.current || refreshing) return;
    const el = scrollRef.current;
    if (!el || el.scrollTop > 0) {
      pulling.current = false;
      setPull(0);
      pullRef.current = 0;
      return;
    }

    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) {
      const next = Math.min(dy * 0.45, 96);
      pullRef.current = next;
      setPull(next);
    }
  }

  function onTouchEnd() {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullRef.current >= PULL_THRESHOLD) {
      void triggerRefresh();
    } else {
      setPull(0);
      pullRef.current = 0;
    }
  }

  const indicatorHeight = refreshing ? 48 : pull;

  return (
    <div
      ref={scrollRef}
      className={cn(
        "h-full overflow-y-auto overscroll-y-contain",
        className
      )}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200"
        style={{ height: indicatorHeight }}
      >
        {(pull > 0 || refreshing) && (
          <Loader2
            className={cn(
              "h-6 w-6 text-zinc-400",
              refreshing && "animate-spin"
            )}
          />
        )}
      </div>
      {children}
    </div>
  );
}
