"use client";

import { useEffect, type RefObject } from "react";

function applyBottomPin(node: HTMLElement) {
  const vv = window.visualViewport;
  if (!vv) {
    node.style.bottom = "0px";
    return;
  }
  const gap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
  node.style.bottom = `${gap}px`;
}

/** Mantiene la barra inferior pegada al borde visible en iOS (Safari / PWA). */
export function useVisualViewportBottomPin(
  ref: RefObject<HTMLElement | null>,
  active = true
) {
  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (!node) return;

    const update = () => {
      if (ref.current) applyBottomPin(ref.current);
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update);
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  }, [ref, active]);
}
