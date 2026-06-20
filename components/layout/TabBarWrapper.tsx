"use client";

import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BottomChrome } from "@/components/layout/BottomChrome";
import { clearDocumentElementPullTransform } from "@/lib/layout/pull-to-refresh";

/** Portal a body — TabBar fija al borde inferior (trincadores). */
export function TabBarWrapper() {
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    clearDocumentElementPullTransform();
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(<BottomChrome />, document.body);
}
