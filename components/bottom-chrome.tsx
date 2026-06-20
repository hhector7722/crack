"use client";

import { usePathname } from "next/navigation";
import { AppBottomNav } from "@/components/app-bottom-nav";

export function BottomChrome() {
  const pathname = usePathname();

  if (pathname === "/login" || pathname.startsWith("/auth")) {
    return null;
  }

  return <AppBottomNav />;
}
