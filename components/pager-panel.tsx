"use client";

import { PullToRefresh } from "@/components/pull-to-refresh";

interface PagerPanelProps {
  onRefresh: () => void | Promise<void>;
  children: React.ReactNode;
}

export function PagerPanel({ onRefresh, children }: PagerPanelProps) {
  return (
    <PullToRefresh onRefresh={onRefresh} className="app-pager-panel">
      {children}
    </PullToRefresh>
  );
}
