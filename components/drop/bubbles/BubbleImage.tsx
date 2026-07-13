"use client";

import { useEffect, useState } from "react";
import { Download, ImageIcon } from "lucide-react";
import { useSignedUrl } from "@/lib/drop/signed-url-cache";

export function BubbleImage({
  path,
  onLoad,
  onExpand,
  onDownload,
}: {
  path: string;
  onLoad?: () => void;
  onExpand: () => void;
  onDownload: () => Promise<void>;
}) {
  const url = useSignedUrl(path);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (url) onLoad?.();
  }, [url, onLoad]);

  async function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    if (downloading) return;
    setDownloading(true);
    try {
      await onDownload();
    } catch {
      /* ignore */
    } finally {
      setDownloading(false);
    }
  }

  if (!url) {
    return (
      <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-lg bg-zinc-800">
        <ImageIcon className="h-5 w-5 text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="group relative h-[4.5rem] w-[4.5rem] shrink-0">
      <button
        type="button"
        onClick={onExpand}
        className="block h-full w-full overflow-hidden rounded-lg"
        aria-label="Ver imagen"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="Drop imagen"
          className="h-full w-full object-cover"
          onLoad={onLoad}
        />
      </button>
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        aria-label="Guardar imagen"
        className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100"
      >
        <Download className="h-3 w-3" />
      </button>
    </div>
  );
}
