/** Lift de la TabBar fija (solo teclado virtual en iOS PWA / Safari). */
export function measureChromeBottomLift(): number {
  if (typeof window === "undefined") return 0;
  const vv = window.visualViewport;
  if (!vv) return 0;
  const keyboardOpen = vv.height < window.innerHeight * 0.82;
  if (!keyboardOpen) return 0;
  return Math.max(0, Math.round(window.innerHeight - vv.offsetTop - vv.height));
}

export function applyVisualViewportChrome(): void {
  if (typeof document === "undefined") return;

  const vv = window.visualViewport;
  const height = vv ? Math.round(vv.height) : window.innerHeight;
  const offsetTop = vv ? Math.round(vv.offsetTop) : 0;
  const root = document.documentElement;

  root.style.setProperty("--app-height", `${height + offsetTop}px`);
  root.style.setProperty("--app-offset-top", `${offsetTop}px`);
  root.style.setProperty(
    "--app-chrome-bottom-lift",
    `${measureChromeBottomLift()}px`
  );
}
