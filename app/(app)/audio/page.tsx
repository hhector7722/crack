"use client";

import { Mic } from "lucide-react";
import { ItemFeed } from "@/components/item-feed";
import { useAppShell } from "@/components/app-shell-context";
import { useRefreshKey } from "../layout";

export default function AudioPage() {
  const refreshKey = useRefreshKey();
  const { openCapture } = useAppShell();

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => openCapture("voice")}
        className="action-accent"
      >
        <Mic className="h-5 w-5" />
        Grabar voz
      </button>
      <ItemFeed filter="audio" refreshKey={refreshKey} />
    </div>
  );
}
