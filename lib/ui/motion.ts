/** Curva estándar iOS (UIViewController push/pop). */
export const IOS_EASE_OUT = "cubic-bezier(0.32, 0.72, 0, 1)";

/** Entrada suave con ligera desaceleración. */
export const IOS_EASE_IN_OUT = "cubic-bezier(0.65, 0, 0.35, 1)";

export const PAGE_PUSH_MS = 360;
export const PANEL_SLIDE_MS = 350;
export const MODAL_ENTER_MS = 260;
export const MODAL_EXIT_MS = 220;

export function iosTransition(property = "transform", durationMs = PAGE_PUSH_MS) {
  return `${property} ${durationMs}ms ${IOS_EASE_OUT}`;
}
