"use client";

import { useEffect } from "react";
import { applyVisualViewportChrome } from "@/lib/ui/viewport-chrome";

export function ViewportHeight() {
  useEffect(() => {
    const sync = () => applyVisualViewportChrome();

    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    window.visualViewport?.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("scroll", sync);

    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
    };
  }, []);

  return null;
}
