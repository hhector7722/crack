"use client";

import { usePathname } from "next/navigation";
import { TabBar } from "@/components/layout/TabBar";

export function BottomChrome() {
  const pathname = usePathname();

  if (pathname === "/login" || pathname.startsWith("/auth")) {
    return null;
  }

  return <TabBar />;
}
