"use client";

import {
  createContext,
  useContext,
  useMemo,
} from "react";

export type CaptureMode = "menu" | "note" | "voice" | "image" | "link";

interface AppShellContextValue {
  openCamera: () => void;
  openGallery: () => void;
  openFilePicker: () => void;
  openCapture: (mode: CaptureMode) => void;
  openCaptureMenu: () => void;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function AppShellProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: AppShellContextValue;
}) {
  const merged = useMemo(() => value, [value]);

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
