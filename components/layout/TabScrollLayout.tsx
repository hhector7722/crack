"use client";

import { useRef, type ReactNode } from "react";
import { useLayoutAboveTabBar } from "@/components/layout/useLayoutAboveTabBar";
import { cn } from "@/lib/utils";

type TabScrollLayoutProps = {
  children: ReactNode;
  className?: string;
};

/** Scroll interno hasta la TabBar (patrón trincadores). */
export function TabScrollLayout({ children, className }: TabScrollLayoutProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  useLayoutAboveTabBar(rootRef);

  return (
    <div ref={rootRef} className={cn("tm-tab-scroll-layout", className)}>
      <div className="tm-tab-scroll-layout__viewport scroll-pb-end">
        {children}
        <div className="scroll-end-touch" aria-hidden />
      </div>
    </div>
  );
}
