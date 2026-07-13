"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export function PendingImageThumb({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="relative h-[4.5rem] w-[4.5rem] shrink-0">
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt={file.name}
          className="h-full w-full rounded-lg object-cover"
        />
      ) : (
        <div className="h-full w-full rounded-lg bg-zinc-800" />
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Quitar imagen"
        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700 text-[10px] text-zinc-200 ring-1 ring-zinc-950"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
