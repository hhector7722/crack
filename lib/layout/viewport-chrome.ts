const BOTTOM_CHROME_SELECTOR = "[data-tm-bottom-chrome]";
const TAB_BAR_SELECTOR = 'nav[aria-label="Navegacion principal"]';

export const VIEWPORT_CHROME_SYNC_EVENT = "tm:viewport-chrome-sync";

function isFormControlFocused(): boolean {
  if (typeof document === "undefined") return false;
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return false;
  if (active.isContentEditable) return true;
  return (
    active instanceof HTMLInputElement ||
    active instanceof HTMLTextAreaElement ||
    active instanceof HTMLSelectElement
  );
}

/** Espacio layout bajo el visual viewport (solo con teclado real abierto). */
export function measureChromeBottomLift(): number {
  if (typeof window === "undefined") return 0;
  const vv = window.visualViewport;
  if (!vv) return 0;
  // En PWA iOS vv.height < innerHeight sin teclado; exigir foco en control de formulario.
  if (!isFormControlFocused()) return 0;
  if (vv.height >= window.innerHeight * 0.75) return 0;
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

  root.style.setProperty("--tm-vv-height", `${height}px`);
  root.style.setProperty("--tm-vv-offset-top", `${offsetTop}px`);
  root.style.setProperty("--tm-chrome-bottom", `${chromeBottom}px`);
  root.style.setProperty("--tm-app-height", `${height + offsetTop}px`);
}

export function resetVisualViewportChrome(): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.style.removeProperty("--tm-vv-height");
  root.style.removeProperty("--tm-vv-offset-top");
  root.style.removeProperty("--tm-chrome-bottom");
  root.style.removeProperty("--tm-app-height");
}

function readTabBarCorePx(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--tm-tabbar-core");
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

/** Borde superior del chrome inferior fijo (fin del área útil del contenido). */
export function readTabBarTop(): number {
  const chrome = document.querySelector<HTMLElement>(BOTTOM_CHROME_SELECTOR);
  if (chrome) {
    return chrome.getBoundingClientRect().top;
  }

  const nav = document.querySelector<HTMLElement>(TAB_BAR_SELECTOR);
  if (nav) {
    return nav.getBoundingClientRect().top;
  }

  const shellRaw = getComputedStyle(document.documentElement).getPropertyValue("--tm-tabbar-shell");
  const shellPx = parseFloat(shellRaw);
  const tabBarShell = Number.isFinite(shellPx) && shellPx > 0 ? shellPx : readTabBarCorePx();

  return readVisibleViewportBottom() - tabBarShell;
}

function readLayoutContentBottom(): number {
  return readTabBarTop();
}

/** Fija la altura de un contenedor flex desde su top hasta la TabBar. */
export function syncLayoutAboveTabBar(root: HTMLElement): number {
  const top = root.getBoundingClientRect().top;
  const height = Math.max(0, Math.floor(readLayoutContentBottom() - top));

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
