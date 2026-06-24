"use client";

import { TabScrollLayout } from "@/components/layout/TabScrollLayout";

interface PagerPanelProps {
  onRefresh: () => void | Promise<void>;
  children: React.ReactNode;
}

export function PagerPanel({ onRefresh, children }: PagerPanelProps) {
  return (
    <TabScrollLayout onRefresh={onRefresh} className="px-[var(--app-gutter)] pt-[var(--app-gutter)]">
      {children}
    </TabScrollLayout>
  );
}
