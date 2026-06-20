"use client";

interface PagerPanelProps {
  onRefresh: () => void | Promise<void>;
  children: React.ReactNode;
}

/** Scroll de documento (como Inicio en Trincadores); clearance vía pb del main. */
export function PagerPanel({ onRefresh: _onRefresh, children }: PagerPanelProps) {
  return (
    <div className="px-[var(--app-gutter)] pt-[var(--app-gutter)]">
      {children}
      <div className="scroll-end-touch" aria-hidden />
    </div>
  );
}
