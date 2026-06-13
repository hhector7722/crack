"use client";

import { createContext, useContext, useState } from "react";
import { LogOut } from "lucide-react";
import { TabBar } from "@/components/tab-bar";
import { FabButton } from "@/components/fab-button";
import { CaptureSheet } from "@/components/capture-sheet";
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <RefreshContext.Provider value={refreshKey}>
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

        <main
          className="px-4 pt-4"
          style={{
            paddingBottom: "calc(7rem + env(safe-area-inset-bottom))",
          }}
        >
          {children}
        </main>

        <FabButton onClick={() => setSheetOpen(true)} />
        <TabBar />

        <CaptureSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onSaved={() => setRefreshKey((k) => k + 1)}
        />
      </div>
    </RefreshContext.Provider>
  );
}
