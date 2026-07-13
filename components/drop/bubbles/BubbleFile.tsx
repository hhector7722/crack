"use client";

import { File, FileText } from "lucide-react";
import { fileLabel, isPreviewablePath } from "@/lib/drop/helpers";
import { useSignedUrl } from "@/lib/drop/signed-url-cache";

const THUMB_CLASS = "h-[4.5rem] w-[4.5rem] shrink-0";

export function BubbleFile({
  path,
  onOpen,
}: {
  path: string;
  onOpen: (url: string) => void;
}) {
  const url = useSignedUrl(path);
  const name = fileLabel(path);
  const previewable = isPreviewablePath(path);

  function handleOpen() {
    if (!url) return;
    onOpen(url);
  }

  return (
    <button
      type="button"
      onClick={handleOpen}
      disabled={!url}
      aria-label={previewable ? `Abrir ${name}` : `Descargar ${name}`}
      className={`flex ${THUMB_CLASS} flex-col items-center justify-center gap-1 rounded-lg bg-zinc-800 px-1 disabled:opacity-60`}
    >
      {previewable ? (
        <FileText className="h-5 w-5 text-violet-400" />
      ) : (
        <File className="h-5 w-5 text-violet-400" />
      )}
      <span className="line-clamp-2 w-full text-center text-[9px] leading-tight text-zinc-400">
        {name}
      </span>
    </button>
  );
}
