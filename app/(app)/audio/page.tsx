"use client";

import { Mic } from "lucide-react";
import { ItemFeed } from "@/components/item-feed";
import { useAppShell } from "@/components/app-shell-context";
import { useRefreshKey } from "../layout";

export default function AudioPage() {
  const refreshKey = useRefreshKey();
  const { openCapture } = useAppShell();

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => openCapture("voice")}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-semibold text-white transition-colors active:bg-red-500"
      >
        <Mic className="h-5 w-5" />
        Grabar voz
      </button>
      <ItemFeed filter="audio" refreshKey={refreshKey} />
    </div>
  );
}
