"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { useSearch } from "@/components/search-context";

type TabScrollLayoutProps = {
  children: ReactNode;
  className?: string;
  onRefresh?: () => Promise<void> | void;
};

export function TabScrollLayout({ children, className, onRefresh }: TabScrollLayoutProps) {
  const { setSearchOpen } = useSearch();
  const viewportClass = "tm-tab-scroll-layout__viewport scroll-pb-end pb-[160px]";

  return (
    <div className={cn("tm-tab-scroll-layout", className)}>
      {onRefresh ? (
        <PullToRefresh
          action="search"
          onPullRelease={() => setSearchOpen(true)}
          className={viewportClass}
        >
          {children}
        </PullToRefresh>
      ) : (
        <div className={viewportClass}>{children}</div>
      )}
    </div>
  );
}
