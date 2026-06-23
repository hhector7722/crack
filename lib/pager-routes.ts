/** Orden de deslizamiento (izq → der), alineado con la tab bar */
export const ALL_PAGER_PATHS = [
  "/",
  "/audio",
  "/media",
  "/notes",
  "/enlaces",
] as const;

export const PAGER_PATHS = ALL_PAGER_PATHS;
export const PAGER_DOT_INDICES = [0, 1, 2, 3, 4] as const;

export const PAGE_COUNT = ALL_PAGER_PATHS.length;

export function pathnameToIndex(pathname: string): number {
  if (pathname.startsWith("/audio")) return 1;
  if (pathname.startsWith("/media")) return 2;
  if (pathname.startsWith("/notes")) return 3;
  if (pathname.startsWith("/enlaces")) return 4;
  return 0;
}

export function pagerIndexToDotIndex(pagerIndex: number): number {
  return pagerIndex;
}
