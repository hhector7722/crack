/** Orden de deslizamiento (izq → der), alineado con la tab bar */
export const ALL_PAGER_PATHS = [
  "/files",
  "/audio",
  "/media",
  "/",
  "/enlaces",
  "/notes",
] as const;

export const PAGER_PATHS = ALL_PAGER_PATHS;
export const PAGER_DOT_INDICES = [0, 1, 2] as const;

export const PAGE_COUNT = ALL_PAGER_PATHS.length;

export function pathnameToIndex(pathname: string): number {
  if (pathname.startsWith("/files")) return 0;
  if (pathname.startsWith("/audio")) return 1;
  if (pathname.startsWith("/media")) return 2;
  if (pathname.startsWith("/enlaces")) return 4;
  if (pathname.startsWith("/notes")) return 5;
  return 3;
}

export function pagerIndexToDotIndex(pagerIndex: number): number {
  if (pagerIndex <= 2) return 0;
  if (pagerIndex === 4 || pagerIndex === 5) return 2;
  return 1;
}
