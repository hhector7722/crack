"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ALL_PAGER_PATHS,
  PAGE_COUNT,
  pathnameToIndex,
} from "@/lib/pager-routes";

export type CaptureMode = "menu" | "note" | "voice";

interface AppShellContextValue {
  openCamera: () => void;
  openGallery: () => void;
  openCapture: (mode: CaptureMode) => void;
  openCaptureMenu: () => void;
  pagerIndex: number;
  setPagerIndex: (index: number) => void;
  navigateToPage: (index: number) => void;
  pagerPageCount: number;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function AppShellProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: Omit<
    AppShellContextValue,
    "pagerIndex" | "setPagerIndex" | "navigateToPage" | "pagerPageCount"
  >;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [pagerIndex, setPagerIndexState] = useState(() =>
    pathnameToIndex(pathname)
  );

  useEffect(() => {
    setPagerIndexState(pathnameToIndex(pathname));
  }, [pathname]);

  const setPagerIndex = useCallback((index: number) => {
    setPagerIndexState(index);
  }, []);

  const navigateToPage = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(PAGE_COUNT - 1, index));
      setPagerIndexState(clamped);
      const target = ALL_PAGER_PATHS[clamped];
      if (pathname !== target) {
        router.replace(target, { scroll: false });
      }
    },
    [pathname, router]
  );

  const merged = useMemo(
    () => ({
      ...value,
      pagerIndex,
      setPagerIndex,
      navigateToPage,
      pagerPageCount: PAGE_COUNT,
    }),
    [value, pagerIndex, setPagerIndex, navigateToPage]
  );

  return (
    <AppShellContext.Provider value={merged}>{children}</AppShellContext.Provider>
  );
}

export function useAppShell() {
  const ctx = useContext(AppShellContext);
  if (!ctx) {
    throw new Error("useAppShell must be used within AppShellProvider");
  }
  return ctx;
}

export function usePager() {
  const { pagerIndex, setPagerIndex, navigateToPage, pagerPageCount } =
    useAppShell();
  return { pagerIndex, setPagerIndex, navigateToPage, pagerPageCount };
}
