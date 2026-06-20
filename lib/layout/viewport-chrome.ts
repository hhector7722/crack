const TAB_BAR_SELECTOR = 'nav[aria-label="Navegacion principal"]';

export const VIEWPORT_CHROME_SYNC_EVENT = "crack:viewport-chrome-sync";

/** Espacio layout bajo el visual viewport (iOS PWA / barra dinámica). */
export function measureChromeBottomLift(): number {
  if (typeof window === "undefined") return 0;
  const vv = window.visualViewport;
  if (!vv) return 0;
  // Solo compensar con teclado abierto; sin teclado evita TabBar flotante en PWA iOS.
  const keyboardOpen = vv.height < window.innerHeight * 0.82;
  if (!keyboardOpen) return 0;
  return Math.max(0, Math.round(window.innerHeight - vv.offsetTop - vv.height));
}

/** Variables vv: altura útil del viewport + lift de la TabBar (iOS PWA / barra Safari). */
export function applyVisualViewportChrome(): void {
  if (typeof document === "undefined") return;

  const vv = window.visualViewport;
  const height = vv ? Math.round(vv.height) : window.innerHeight;
  const offsetTop = vv ? Math.round(vv.offsetTop) : 0;
  const chromeBottom = measureChromeBottomLift();
  const root = document.documentElement;

  root.style.setProperty("--app-vv-height", `${height}px`);
  root.style.setProperty("--app-vv-offset-top", `${offsetTop}px`);
  root.style.setProperty("--app-chrome-bottom", `${chromeBottom}px`);
  root.style.setProperty("--app-shell-height", `${height + offsetTop}px`);
}

export function resetVisualViewportChrome(): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.style.removeProperty("--app-vv-height");
  root.style.removeProperty("--app-vv-offset-top");
  root.style.removeProperty("--app-chrome-bottom");
  root.style.removeProperty("--app-shell-height");
}

function readTabBarCorePx(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(
    "--app-tabbar-core"
  );
  const parsed = parseFloat(raw);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return 80;
}

function readVisibleViewportBottom(): number {
  const vv = window.visualViewport;
  return vv ? vv.offsetTop + vv.height : window.innerHeight;
}

/** Borde superior de la TabBar fija (fin del área útil del contenido). */
export function readTabBarTop(): number {
  const nav = document.querySelector<HTMLElement>(TAB_BAR_SELECTOR);
  if (nav) {
    return nav.getBoundingClientRect().top;
  }

  const shellRaw = getComputedStyle(document.documentElement).getPropertyValue(
    "--app-tabbar-shell"
  );
  const shellPx = parseFloat(shellRaw);
  const tabBarShell =
    Number.isFinite(shellPx) && shellPx > 0 ? shellPx : readTabBarCorePx();

  return readVisibleViewportBottom() - tabBarShell;
}

/** Borde inferior de la TabBar (debe coincidir con el borde visible del viewport). */
export function readTabBarBottom(): number {
  const nav = document.querySelector<HTMLElement>(TAB_BAR_SELECTOR);
  if (nav) {
    return nav.getBoundingClientRect().bottom;
  }

  return readVisibleViewportBottom();
}

/** Fija la altura de un contenedor flex desde su top hasta la TabBar. */
export function syncLayoutAboveTabBar(root: HTMLElement): number {
  const top = root.getBoundingClientRect().top;
  const height = Math.max(0, Math.floor(readTabBarTop() - top));

  root.style.height = `${height}px`;
  root.style.maxHeight = `${height}px`;
  root.style.flex = "0 0 auto";

  return height;
}

export function resetLayoutAboveTabBar(root: HTMLElement): void {
  root.style.removeProperty("height");
  root.style.removeProperty("min-height");
  root.style.removeProperty("max-height");
  root.style.removeProperty("flex");
}
