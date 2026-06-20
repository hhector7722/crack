"use client";

import { useEffect } from "react";

function applyViewportHeight() {
  const height = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty("--app-height", `${height}px`);
}

export function ViewportHeight() {
  useEffect(() => {
    applyViewportHeight();

    window.addEventListener("resize", applyViewportHeight);
    window.addEventListener("orientationchange", applyViewportHeight);
    window.visualViewport?.addEventListener("resize", applyViewportHeight);
    window.visualViewport?.addEventListener("scroll", applyViewportHeight);

    return () => {
      window.removeEventListener("resize", applyViewportHeight);
      window.removeEventListener("orientationchange", applyViewportHeight);
      window.visualViewport?.removeEventListener("resize", applyViewportHeight);
      window.visualViewport?.removeEventListener("scroll", applyViewportHeight);
    };
  }, []);

  return null;
}
