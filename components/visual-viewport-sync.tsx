"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import {
  applyVisualViewportChrome,
  VIEWPORT_CHROME_SYNC_EVENT,
} from "@/lib/layout/viewport-chrome";

function isFormChromeTarget(
  target: EventTarget | null
): target is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement
  );
}

/** Sincroniza la altura del shell con el visual viewport (iOS PWA). */
export function VisualViewportSync() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const sync = () => {
      applyVisualViewportChrome();
      window.dispatchEvent(new Event(VIEWPORT_CHROME_SYNC_EVENT));
    };

    const syncAfterFormControl = (target: EventTarget | null) => {
      if (!isFormChromeTarget(target)) return;
      sync();
      requestAnimationFrame(sync);
      window.setTimeout(sync, 120);
      window.setTimeout(sync, 320);
    };

    sync();
    const frame = requestAnimationFrame(sync);

    const handleFocusOut = (event: FocusEvent) => {
      syncAfterFormControl(event.target);
    };

    const handlePageShow = () => {
      sync();
      requestAnimationFrame(sync);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        sync();
        requestAnimationFrame(sync);
      }
    };

    window.visualViewport?.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      cancelAnimationFrame(frame);
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, [pathname]);

  return null;
}
