"use client";

import { useEffect } from "react";
import { Loader2, Play } from "lucide-react";
import { useSignedUrl } from "@/lib/drop/signed-url-cache";

const THUMB_CLASS = "h-[4.5rem] w-[4.5rem] shrink-0";

export function BubbleVideo({
  path,
  onLoad,
  onExpand,
}: {
  path: string;
  onLoad?: () => void;
  onExpand: () => void;
}) {
  const url = useSignedUrl(path);

  useEffect(() => {
    if (url) onLoad?.();
  }, [url, onLoad]);

  if (!url) {
    return (
      <div
        className={`flex ${THUMB_CLASS} items-center justify-center rounded-lg bg-zinc-800`}
      >
        <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onExpand}
      aria-label="Reproducir vídeo"
      className={`relative overflow-hidden rounded-lg ${THUMB_CLASS}`}
    >
      <video
        src={url}
        muted
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
        onLoadedData={onLoad}
      />
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
        <Play className="h-5 w-5 fill-white text-white" />
      </span>
    </button>
  );
}
