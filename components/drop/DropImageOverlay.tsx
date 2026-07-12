"use client";

import { Loader2, X } from "lucide-react";
import { useSignedUrl } from "@/lib/drop/signed-url-cache";

export function DropImageOverlay({
  path,
  onClose,
}: {
  path: string;
  onClose: () => void;
}) {
  const url = useSignedUrl(path);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
      >
        <X className="h-5 w-5" />
      </button>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="Drop imagen ampliada"
          className="max-h-full max-w-full rounded-lg object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      )}
    </div>
  );
}
