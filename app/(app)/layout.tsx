"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { CaptureSheet } from "@/components/capture-sheet";
import { AppBottomNavPortal } from "@/components/app-bottom-nav-portal";
import { AppPager } from "@/components/app-pager";
import { ViewportHeight } from "@/components/viewport-height";
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

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, []);

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
        <ViewportHeight />
        <div className="app-shell">
          <header className="app-header relative">
            <h1 className="text-lg font-bold tracking-tight">Crack</h1>
            <button
              type="button"
              onClick={openCaptureMenu}
              aria-label="Crear"
              className="absolute right-[var(--app-gutter)] flex h-10 min-h-10 w-10 min-w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-950 shadow-lg shadow-black/40 transition-transform active:scale-95 sm:h-12 sm:min-h-12 sm:w-12 sm:min-w-12"
            >
              <Plus className="h-6 w-6" strokeWidth={2.5} />
            </button>
          </header>

          {uploadError && (
            <p className="mx-4 mt-3 shrink-0 px-4 text-sm text-red-300">
              {uploadError}
            </p>
          )}

          {uploading && (
            <p className="mx-4 mt-3 shrink-0 text-center text-sm text-zinc-400">
              Subiendo imagen...
            </p>
          )}

          <main className="app-main">
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

        <AppBottomNavPortal />
      </AppShellProvider>
    </RefreshContext.Provider>
  );
}
