"use client";

import { ImagePlus } from "lucide-react";
import { ItemFeed } from "@/components/item-feed";
import { useAppShell } from "@/components/app-shell-context";
import { useRefreshKey } from "../layout";

export default function MediaPage() {
  const refreshKey = useRefreshKey();
  const { openGallery } = useAppShell();

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={openGallery}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 text-sm font-semibold text-zinc-100 transition-colors active:bg-zinc-800"
      >
        <ImagePlus className="h-5 w-5" />
        Añadir de galería
      </button>
      <ItemFeed filter="image" refreshKey={refreshKey} />
    </div>
  );
}
