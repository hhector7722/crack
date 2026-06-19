"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type CaptureMode = "menu" | "note" | "voice";

interface AppShellContextValue {
  openCamera: () => void;
  openGallery: () => void;
  openCapture: (mode: CaptureMode) => void;
  openCaptureMenu: () => void;
  pagerIndex: number;
  setPagerIndex: (index: number) => void;
  pagerPageCount: number;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function AppShellProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: Omit<AppShellContextValue, "pagerIndex" | "setPagerIndex" | "pagerPageCount">;
}) {
  const [pagerIndex, setPagerIndexState] = useState(1);

  const setPagerIndex = useCallback((index: number) => {
    setPagerIndexState(index);
  }, []);

  const merged = useMemo(
    () => ({
      ...value,
      pagerIndex,
      setPagerIndex,
      pagerPageCount: 3,
    }),
    [value, pagerIndex, setPagerIndex]
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
  const { pagerIndex, setPagerIndex, pagerPageCount } = useAppShell();
  return { pagerIndex, setPagerIndex, pagerPageCount };
}
