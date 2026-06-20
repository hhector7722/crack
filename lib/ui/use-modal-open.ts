"use client";

import { useEffect } from "react";

/** Marca el documento mientras un modal/drawer está abierto (bloquea swipe de tabs). */
export function useModalOpen(open: boolean) {
  useEffect(() => {
    if (!open) return;
    document.documentElement.setAttribute("data-modal-open", "true");
    return () => {
      document.documentElement.removeAttribute("data-modal-open");
    };
  }, [open]);
}
