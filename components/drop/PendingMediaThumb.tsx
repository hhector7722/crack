"use client";

import { useEffect, useState } from "react";
import { File, FileText, Play, X } from "lucide-react";
import {
  contentTypeFromFile,
  isPreviewableFile,
} from "@/lib/drop/helpers";

const THUMB_CLASS = "h-[4.5rem] w-[4.5rem] shrink-0";

export function PendingMediaThumb({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const contentType = contentTypeFromFile(file);
  const previewable = isPreviewableFile(file);

  useEffect(() => {
    if (contentType === "image" || contentType === "video") {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [contentType, file]);

  return (
    <div className={`relative ${THUMB_CLASS}`}>
      {contentType === "image" && previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt={file.name}
          className="h-full w-full rounded-lg object-cover"
        />
      ) : contentType === "video" && previewUrl ? (
        <div className="relative h-full w-full overflow-hidden rounded-lg bg-zinc-800">
          <video
            src={previewUrl}
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          />
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
            <Play className="h-5 w-5 fill-white text-white" />
          </span>
        </div>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-lg bg-zinc-800 px-1">
          {previewable ? (
            <FileText className="h-5 w-5 text-violet-400" />
          ) : (
            <File className="h-5 w-5 text-violet-400" />
          )}
          <span className="line-clamp-2 w-full text-center text-[9px] leading-tight text-zinc-400">
            {file.name}
          </span>
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Quitar archivo"
        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700 text-zinc-200 ring-1 ring-zinc-950"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
