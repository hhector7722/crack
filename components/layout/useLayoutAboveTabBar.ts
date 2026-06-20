"use client";

import { useLayoutEffect, type RefObject } from "react";
import {
  resetLayoutAboveTabBar,
  syncLayoutAboveTabBar,
  VIEWPORT_CHROME_SYNC_EVENT,
} from "@/lib/layout/viewport-chrome";

/** Fija la altura del contenedor hasta la TabBar. */
export function useLayoutAboveTabBar(
  rootRef: RefObject<HTMLElement | null>,
  enabled = true
) {
  useLayoutEffect(() => {
    if (!enabled) return;

    const root = rootRef.current;
    if (!root) return;

    const sync = () => {
      syncLayoutAboveTabBar(root);
    };

    sync();
    requestAnimationFrame(sync);

    const observedNodes = new Set<Element>();

    const observeNode = (node: Element | null | undefined) => {
      if (!node || observedNodes.has(node)) return;
      observedNodes.add(node);
      observer.observe(node);
    };

    const observer = new ResizeObserver(sync);
    observeNode(root);
    observeNode(root.parentElement);

    const observeChromeNodes = () => {
      observeNode(document.querySelector('nav[aria-label="Navegacion principal"]'));
    };

    observeChromeNodes();

    const mutationObserver = new MutationObserver(() => {
      observeChromeNodes();
      sync();
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("resize", sync);
    window.addEventListener(VIEWPORT_CHROME_SYNC_EVENT, sync);
    window.visualViewport?.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("scroll", sync);

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
      window.removeEventListener("resize", sync);
      window.removeEventListener(VIEWPORT_CHROME_SYNC_EVENT, sync);
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
      resetLayoutAboveTabBar(root);
    };
  }, [rootRef, enabled]);
}
