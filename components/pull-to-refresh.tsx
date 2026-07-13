"use client";

import { useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { iosTransition } from "@/lib/ui/motion";

export type PullAction = "search" | "refresh";

interface PullToRefreshProps {
  action: PullAction;
  onPullRelease: () => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
}

const PULL_THRESHOLD = 72;

export function PullToRefresh({
  action,
  onPullRelease,
  children,
  className,
}: PullToRefreshProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pull, setPull] = useState(0);
  const [acting, setActing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  async function triggerAction() {
    if (acting) return;
    setActing(true);
    setPull(48);
    try {
      await onPullRelease();
    } finally {
      setActing(false);
      setPull(0);
    }
  }

  function onTouchStart(e: React.TouchEvent) {
    const el = scrollRef.current;
    if (!el || acting) return;
    if (el.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!pulling.current || acting) return;
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
      void triggerAction();
    } else {
      setPull(0);
    }
  }

  const ActionIcon = action === "search" ? Search : Loader2;

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
        className="pointer-events-none absolute left-0 top-0 flex w-full items-center justify-center"
        style={{
          transform: `translateY(${Math.max(0, pull - 40)}px)`,
          opacity: pull > 10 ? 1 : 0,
          transition: pulling.current ? "none" : iosTransition("transform", 300),
        }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 shadow-md">
          <ActionIcon
            className={cn(
              "h-5 w-5 text-zinc-400",
              action === "refresh" && acting && "animate-spin"
            )}
            style={{
              transform:
                action === "search"
                  ? undefined
                  : `rotate(${pull * 2}deg)`,
              animation:
                action === "refresh" && acting
                  ? "spin 1s linear infinite"
                  : "none",
            }}
          />
        </div>
      </div>
      <div
        className="min-h-full"
        style={{
          transform: `translateY(${acting ? 48 : pull}px)`,
          transition: pulling.current ? "none" : iosTransition("transform", 300),
        }}
      >
        {children}
      </div>
    </div>
  );
}
