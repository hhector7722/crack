/** Orden de deslizamiento (izq → der), alineado con la tab bar */
export const ALL_PAGER_PATHS = [
  "/audio",
  "/media",
  "/",
  "/notes",
  "/profile",
] as const;

/** Tres indicadores centrales: galería | inicio | notas */
export const PAGER_PATHS = ["/media", "/", "/notes"] as const;
export const PAGER_DOT_INDICES = [1, 2, 3] as const;

export const PAGE_COUNT = ALL_PAGER_PATHS.length;

export function pathnameToIndex(pathname: string): number {
  if (pathname.startsWith("/audio")) return 0;
  if (pathname.startsWith("/media")) return 1;
  if (pathname.startsWith("/notes")) return 3;
  if (pathname.startsWith("/profile")) return 4;
  return 2;
}

/** Índice visual de los 3 indicadores (audio→galería, perfil→notas) */
export function pagerIndexToDotIndex(pagerIndex: number): number {
  if (pagerIndex <= 0) return 1;
  if (pagerIndex >= 4) return 3;
  return pagerIndex;
}
