"use client";

import { useEffect } from "react";

function applyViewportMetrics() {
  const vv = window.visualViewport;
  const height = vv?.height ?? window.innerHeight;
  const width = vv?.width ?? window.innerWidth;
  const offsetTop = vv?.offsetTop ?? 0;
  const root = document.documentElement;
  root.style.setProperty("--app-height", `${height}px`);
  root.style.setProperty("--app-width", `${width}px`);
  root.style.setProperty("--app-offset-top", `${offsetTop}px`);
}

export function ViewportHeight() {
  useEffect(() => {
    applyViewportMetrics();

    window.addEventListener("resize", applyViewportMetrics);
    window.addEventListener("orientationchange", applyViewportMetrics);
    window.visualViewport?.addEventListener("resize", applyViewportMetrics);
    window.visualViewport?.addEventListener("scroll", applyViewportMetrics);

    return () => {
      window.removeEventListener("resize", applyViewportMetrics);
      window.removeEventListener("orientationchange", applyViewportMetrics);
      window.visualViewport?.removeEventListener("resize", applyViewportMetrics);
      window.visualViewport?.removeEventListener(
        "scroll",
        applyViewportMetrics
      );
    };
  }, []);

  return null;
}
