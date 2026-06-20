"use client";

interface PagerPanelProps {
  onRefresh: () => void | Promise<void>;
  children: React.ReactNode;
}

/** Clearance inferior solo vía pb del main; sin scroll-end-touch duplicado. */
export function PagerPanel({ onRefresh: _onRefresh, children }: PagerPanelProps) {
  return (
    <div className="px-[var(--app-gutter)] pt-[var(--app-gutter)] pb-2">
      {children}
    </div>
  );
}
