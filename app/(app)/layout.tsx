"use client";

import { Suspense, useEffect } from "react";
import { UrlSyncObserver } from "@/components/url-sync-observer";
import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
} from "react";
import { Settings, X } from "lucide-react";
import { CaptureSheet } from "@/components/capture-sheet";
import { TabBarWrapper } from "@/components/layout/TabBarWrapper";

import { AppPager } from "@/components/app-pager";
import { ProfileView } from "@/components/profile-view";
import { AppShellProvider, type CaptureMode } from "@/components/app-shell-context";
import { SearchProvider, useSearch } from "@/components/search-context";
import { uploadMediaFromFile } from "@/lib/image-upload";
import { uploadFileFromPicker } from "@/lib/file-upload";

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

function KeyboardShortcuts() {
  const { toggleSearch } = useSearch();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggleSearch();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggleSearch]);

  return null;
}

export default function AppLayout({
  children: _children,
}: {
  children: React.ReactNode;
}) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<CaptureMode>("menu");
  const [sheetKey, setSheetKey] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
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

  const openFilePicker = useCallback(() => {
    setUploadError(null);
    documentInputRef.current?.click();
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

  async function handleMediaSelected(
    e: React.ChangeEvent<HTMLInputElement>,
    _source: "camera" | "gallery"
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      await uploadMediaFromFile(file);
      bumpRefresh();
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Error subiendo archivo"
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDocumentSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      await uploadFileFromPicker(file);
      bumpRefresh();
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Error subiendo archivo"
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <RefreshContext.Provider value={{ refreshKey, bumpRefresh }}>
      <AppShellProvider
        value={{ openCamera, openGallery, openFilePicker, openCapture, openCaptureMenu }}
      >
        <SearchProvider>
          <KeyboardShortcuts />
          <div className="tm-app-shell relative">
            <div className="tm-app-shell-bg" aria-hidden="true" />
            <div
              id="tm-safe-probe"
              className="pointer-events-none fixed left-0 top-0 -z-50 h-0 w-0 overflow-hidden pb-safe"
              aria-hidden
            />

            <header className="tm-app-header tm-app-header-fixed fixed top-0 right-0 left-0 z-[100] shrink-0 bg-[var(--tm-bg)] px-4 pb-2 pt-12">
              <div className="relative flex h-[var(--tm-app-header-inner)] min-h-[var(--tm-app-header-inner)] items-center justify-center px-2">
                <h1 className="text-lg font-bold tracking-tight">Crack</h1>
                <div className="absolute left-2">
                  <button
                    type="button"
                    onClick={() => setShowProfile((v) => !v)}
                    aria-label="Ajustes"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors active:text-zinc-100"
                  >
                    {showProfile ? <X className="h-5 w-5" /> : <Settings className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </header>

            <main className="tm-app-main tm-app-main--internal-scroll relative z-10 flex w-full flex-col overflow-hidden pb-0 pt-[var(--tm-app-header-block)]">
              {uploadError ? (
                <p className="mx-4 shrink-0 px-4 text-sm text-red-300">{uploadError}</p>
              ) : null}
              {uploading ? (
                <p className="mx-4 shrink-0 text-center text-sm text-zinc-400">
                  Subiendo...
                </p>
              ) : null}
              {showProfile ? (
                <div className="flex-1 overflow-y-auto px-4 pb-6">
                  <ProfileView />
                </div>
              ) : (
                <>
                  <Suspense fallback={null}>
                    <UrlSyncObserver />
                  </Suspense>
                  <AppPager refreshKey={refreshKey} />
                </>
              )}
            </main>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*,video/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleMediaSelected(e, "camera")}
            />

            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => handleMediaSelected(e, "gallery")}
            />

            <input
              ref={documentInputRef}
              type="file"
              className="hidden"
              onChange={handleDocumentSelected}
            />

            <CaptureSheet
              key={sheetKey}
              open={sheetOpen}
              mode={sheetMode}
              onOpenChange={setSheetOpen}
              onSaved={bumpRefresh}
            />
            <TabBarWrapper />
          </div>
        </SearchProvider>
      </AppShellProvider>
    </RefreshContext.Provider>
  );
}
