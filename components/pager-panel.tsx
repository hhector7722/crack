"use client";

import { TabScrollLayout } from "@/components/layout/TabScrollLayout";

interface PagerPanelProps {
  onRefresh: () => void | Promise<void>;
  children: React.ReactNode;
}

export function PagerPanel({ onRefresh: _onRefresh, children }: PagerPanelProps) {
  return (
    <TabScrollLayout className="px-[var(--app-gutter)] pt-[var(--app-gutter)]">
      {children}
    </TabScrollLayout>
  );
}
