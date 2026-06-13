"use client";

import { createContext, useContext, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { TabBar } from "@/components/tab-bar";
import { CaptureSheet } from "@/components/capture-sheet";
import { AppShellProvider, type CaptureMode } from "@/components/app-shell-context";
import { uploadImageFromFile } from "@/lib/image-upload";
import { signOut } from "@/app/login/actions";

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
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<CaptureMode>("note");
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
      <AppShellProvider value={{ openCamera, openGallery, openCapture }}>
        <div className="mx-auto min-h-dvh max-w-[430px] bg-zinc-950 text-zinc-100">
          <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur-lg">
            <h1 className="text-lg font-bold tracking-tight">Crack</h1>
            <form action={signOut}>
              <button
                type="submit"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </form>
          </header>

          {uploadError && (
            <p className="mx-4 mt-3 px-4 text-sm text-red-300">{uploadError}</p>
          )}

          {uploading && (
            <p className="mx-4 mt-3 text-center text-sm text-zinc-400">
              Subiendo imagen...
            </p>
          )}

          <main
            className="px-4 pt-4"
            style={{
              paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom))",
            }}
          >
            {children}
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

          <TabBar />

          <CaptureSheet
            open={sheetOpen}
            mode={sheetMode}
            onOpenChange={setSheetOpen}
            onSaved={bumpRefresh}
          />
        </div>
      </AppShellProvider>
    </RefreshContext.Provider>
  );
}
