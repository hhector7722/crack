"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type TabScrollLayoutProps = {
  children: ReactNode;
  className?: string;
  onRefresh?: () => Promise<void> | void;
};

import { PullToRefresh } from "@/components/pull-to-refresh";

export function TabScrollLayout({ children, className, onRefresh }: TabScrollLayoutProps) {
  const viewportClass = "tm-tab-scroll-layout__viewport scroll-pb-end pb-[160px]";

  return (
    <div className={cn("tm-tab-scroll-layout", className)}>
      {onRefresh ? (
        <PullToRefresh onRefresh={onRefresh} className={viewportClass}>
          {children}
        </PullToRefresh>
      ) : (
        <div className={viewportClass}>
          {children}
        </div>
      )}
    </div>
  );
}
