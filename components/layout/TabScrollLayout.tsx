"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type TabScrollLayoutProps = {
  children: ReactNode;
  className?: string;
};

export function TabScrollLayout({ children, className }: TabScrollLayoutProps) {
  return (
    <div className={cn("tm-tab-scroll-layout", className)}>
      <div className="tm-tab-scroll-layout__viewport scroll-pb-end pb-[160px]">
        {children}
      </div>
    </div>
  );
}
