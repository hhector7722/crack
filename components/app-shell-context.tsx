"use client";

import { createContext, useContext } from "react";

export type CaptureMode = "note" | "voice";

interface AppShellContextValue {
  openCamera: () => void;
  openGallery: () => void;
  openCapture: (mode: CaptureMode) => void;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function AppShellProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: AppShellContextValue;
}) {
  return (
    <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>
  );
}

export function useAppShell() {
  const ctx = useContext(AppShellContext);
  if (!ctx) {
    throw new Error("useAppShell must be used within AppShellProvider");
  }
  return ctx;
}
