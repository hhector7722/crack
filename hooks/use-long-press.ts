"use client";

import { useRef } from "react";

export function useLongPress(onLongPress: () => void, delayMs = 500) {
  const timerRef = useRef(0);
  const longPressRef = useRef(false);

  function clearTimer() {
    window.clearTimeout(timerRef.current);
  }

  return {
    onPointerDown: () => {
      longPressRef.current = false;
      clearTimer();
      timerRef.current = window.setTimeout(() => {
        longPressRef.current = true;
        onLongPress();
      }, delayMs);
    },
    onPointerUp: () => clearTimer(),
    onPointerLeave: () => clearTimer(),
    onPointerCancel: () => clearTimer(),
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault();
      onLongPress();
    },
    consumeLongPress: () => {
      if (!longPressRef.current) return false;
      longPressRef.current = false;
      return true;
    },
  };
}
