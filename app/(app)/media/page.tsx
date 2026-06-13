"use client";

import { ImagePlus } from "lucide-react";
import { ItemFeed } from "@/components/item-feed";
import { useAppShell } from "@/components/app-shell-context";
import { useRefreshKey } from "../layout";

export default function MediaPage() {
  const refreshKey = useRefreshKey();
  const { openGallery } = useAppShell();

  return (
    <div className="space-y-2">
      <button type="button" onClick={openGallery} className="action-ghost">
        <ImagePlus className="h-5 w-5" />
        Añadir de galería
      </button>
      <ItemFeed filter="image" refreshKey={refreshKey} />
    </div>
  );
}
