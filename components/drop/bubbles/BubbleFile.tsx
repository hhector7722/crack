"use client";

import { Check, Download, ExternalLink, File } from "lucide-react";
import { useSignedUrl } from "@/lib/drop/signed-url-cache";
import { fileLabel } from "@/lib/drop/helpers";

export function BubbleFile({
  path,
  onCopy,
  copied,
}: {
  path: string;
  onCopy: () => void;
  copied: boolean;
}) {
  const url = useSignedUrl(path);
  const name = fileLabel(path);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <File className="h-5 w-5 shrink-0 text-violet-400" />
        <span className="max-w-[10rem] truncate text-sm text-zinc-200">{name}</span>
      </div>
      <div className="flex gap-2">
        {url ? (
          <a
            href={url}
            download={name}
            className="flex h-8 items-center gap-1.5 rounded-md bg-zinc-700 px-3 text-xs font-semibold text-zinc-100 transition-colors hover:bg-zinc-600"
          >
            <Download className="h-3.5 w-3.5" />
            Descargar
          </a>
        ) : null}
        <button
          type="button"
          onClick={onCopy}
          className="flex h-8 items-center gap-1.5 rounded-md bg-zinc-700 px-3 text-xs font-semibold text-zinc-100 transition-colors hover:bg-zinc-600"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <ExternalLink className="h-3.5 w-3.5" />
          )}
          {copied ? "Copiado" : "Copiar enlace"}
        </button>
      </div>
    </div>
  );
}
