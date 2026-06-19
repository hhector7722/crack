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
import { TabBar } from "@/components/tab-bar";
import { CaptureSheet } from "@/components/capture-sheet";
import { AppShellProvider, type CaptureMode } from "@/components/app-shell-context";
import { uploadImageFromFile } from "@/lib/image-upload";

const RefreshContext = createContext(0);

export function useRefreshKey() {
  return useContext(RefreshContext);
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
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
    const prevBodyPosition = body.style.position;
    const prevBodyWidth = body.style.width;
    const prevBodyHeight = body.style.height;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.width = "100%";
    body.style.height = "100%";

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.position = prevBodyPosition;
      body.style.width = prevBodyWidth;
      body.style.height = prevBodyHeight;
    };
  }, []);

  const bumpRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const openCamera = useCallback(() => {
    setUploadError(null);
    cameraInputRef.current?.click();
  }, []);

  const openGallery = useCallback(() => {
    setUploadError(null);
    cameraInputRef.current?.click();
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
    source: "camera" | "gallery"
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      await uploadImageFromFile(file);
      bumpRefresh();
      if (source === "camera") {
        router.push("/media");
      }
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Error subiendo imagen"
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <RefreshContext.Provider value={refreshKey}>
      <AppShellProvider
        value={{ openCamera, openGallery, openCapture, openCaptureMenu }}
      >
        <div className="app-shell">
          <header className="app-header">
            <h1 className="text-lg font-bold tracking-tight">Crack</h1>
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

          <main className="app-main">{children}</main>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleImageSelected(e, "camera")}
          />

          <CaptureSheet
            key={sheetKey}
            open={sheetOpen}
            mode={sheetMode}
            onOpenChange={setSheetOpen}
            onSaved={bumpRefresh}
          />
        </div>

        <TabBar />
      </AppShellProvider>
    </RefreshContext.Provider>
  );
}
