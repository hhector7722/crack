"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { iosTransition } from "@/lib/ui/motion";

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

  async function triggerRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    setPull(48);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
      setPull(0);
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
      return;
    }

    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) {
      const next = Math.min(dy * 0.45, 120);
      setPull(next);
      if (e.cancelable) e.preventDefault();
    }
  }

  function onTouchEnd() {
    if (!pulling.current) return;
    pulling.current = false;
    if (pull >= PULL_THRESHOLD) {
      void triggerRefresh();
    } else {
      setPull(0);
    }
  }

  return (
    <div
      ref={scrollRef}
      className={cn(
        "relative h-full overflow-y-auto overscroll-y-none",
        className
      )}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div
        className="absolute left-0 top-0 flex w-full items-center justify-center pointer-events-none"
        style={{
          transform: `translateY(${Math.max(0, pull - 40)}px)`,
          opacity: pull > 10 ? 1 : 0,
          transition: pulling.current ? "none" : iosTransition("transform", 300),
        }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 shadow-md">
          <Loader2
            className={cn(
              "h-5 w-5 text-zinc-400",
              refreshing && "animate-spin"
            )}
            style={{
              transform: `rotate(${pull * 2}deg)`,
              animation: refreshing ? "spin 1s linear infinite" : "none"
            }}
          />
        </div>
      </div>
      <div
        className="min-h-full"
        style={{
          transform: `translateY(${refreshing ? 48 : pull}px)`,
          transition: pulling.current ? "none" : iosTransition("transform", 300),
        }}
      >
        {children}
      </div>
    </div>
  );
}
