"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { CaptureSheet } from "@/components/capture-sheet";
import { TabBarWrapper } from "@/components/layout/TabBarWrapper";
import { VisualViewportSync } from "@/components/layout/VisualViewportSync";
import { AppPager } from "@/components/app-pager";
import { AppShellProvider, type CaptureMode } from "@/components/app-shell-context";
import { uploadImageFromFile } from "@/lib/image-upload";

const RefreshContext = createContext({
  refreshKey: 0,
  bumpRefresh: () => {},
});

export function useRefreshKey() {
  return useContext(RefreshContext).refreshKey;
}

export function useBumpRefresh() {
  return useContext(RefreshContext).bumpRefresh;
}

export default function AppLayout({
  children: _children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<CaptureMode>("menu");
  const [sheetKey, setSheetKey] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const bumpRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const openCamera = useCallback(() => {
    setUploadError(null);
    cameraInputRef.current?.click();
  }, []);

  const openGallery = useCallback(() => {
    setUploadError(null);
    galleryInputRef.current?.click();
  }, []);

  const openCapture = useCallback((mode: CaptureMode) => {
    setSheetMode(mode);
    setSheetKey((k) => k + 1);
    setSheetOpen(true);
  }, []);

  const openCaptureMenu = useCallback(() => {
    setSheetMode("menu");
    setSheetKey((k) => k + 1);
    setSheetOpen(true);
  }, []);

  async function handleImageSelected(
    e: React.ChangeEvent<HTMLInputElement>,
    _source: "camera" | "gallery"
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      await uploadImageFromFile(file);
      bumpRefresh();
      router.push("/media");
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Error subiendo imagen"
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <RefreshContext.Provider value={{ refreshKey, bumpRefresh }}>
      <AppShellProvider
        value={{ openCamera, openGallery, openCapture, openCaptureMenu }}
      >
        <div className="tm-app-shell relative">
          <div className="tm-app-shell-bg" aria-hidden="true" />
          <div
            id="tm-safe-probe"
            className="pointer-events-none fixed left-0 top-0 -z-50 h-0 w-0 overflow-hidden pb-safe"
            aria-hidden
          />

          <header className="tm-app-header tm-app-header-fixed fixed right-0 left-0 z-[100] shrink-0 border-b border-[var(--tm-border)] bg-[var(--tm-bg)]/80 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md">
            <div className="tm-app-header__row relative flex h-[var(--tm-app-header-inner)] min-h-[var(--tm-app-header-inner)] items-center justify-center">
              <h1 className="text-lg font-bold tracking-tight">Crack</h1>
              <button
                type="button"
                onClick={openCaptureMenu}
                aria-label="Crear"
                className="absolute right-0 flex h-10 min-h-10 w-10 min-w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-950 shadow-lg shadow-black/40 transition-transform active:scale-95 sm:h-12 sm:min-h-12 sm:w-12 sm:min-w-12"
              >
                <Plus className="h-6 w-6" strokeWidth={2.5} />
              </button>
            </div>
          </header>

          <main className="tm-app-main relative z-10 w-full pt-[var(--tm-app-header-block)] pb-[var(--tm-tabbar-shell)]">
            {uploadError ? (
              <p className="mx-4 shrink-0 px-4 text-sm text-red-300">{uploadError}</p>
            ) : null}
            {uploading ? (
              <p className="mx-4 shrink-0 text-center text-sm text-zinc-400">
                Subiendo imagen...
              </p>
            ) : null}
            <AppPager refreshKey={refreshKey} />
          </main>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleImageSelected(e, "camera")}
          />

          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImageSelected(e, "gallery")}
          />

          <CaptureSheet
            key={sheetKey}
            open={sheetOpen}
            mode={sheetMode}
            onOpenChange={setSheetOpen}
            onSaved={bumpRefresh}
          />
        </div>

        <TabBarWrapper />
        <VisualViewportSync />
      </AppShellProvider>
    </RefreshContext.Provider>
  );
}
