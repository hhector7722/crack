"use client";

import { PullToRefresh } from "@/components/pull-to-refresh";
import { TabBar } from "@/components/tab-bar";
import { usePager } from "@/components/app-shell-context";

interface PagerPanelProps {
  pageIndex: number;
  onRefresh: () => void | Promise<void>;
  children: React.ReactNode;
}

/** Panel con scroll vertical; la TabBar queda al final del contenido. */
export function PagerPanel({
  pageIndex,
  onRefresh,
  children,
}: PagerPanelProps) {
  const { pagerIndex } = usePager();

  return (
    <PullToRefresh onRefresh={onRefresh} className="app-pager-panel">
      <div className="flex min-h-full flex-col">
        <div className="flex-1">{children}</div>
        {pagerIndex === pageIndex && <TabBar />}
      </div>
    </PullToRefresh>
  );
}
