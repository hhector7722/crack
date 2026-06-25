"use client";

import { useEffect, useState } from "react";
import { Link2, Loader2, ExternalLink } from "lucide-react";
import { resolveLinkTitle, titleFromUrl } from "@/lib/link-preview";
import { cn } from "@/lib/utils";
import type { ItemMetadata } from "@/lib/types";

interface LinkNotePreviewProps {
  url: string;
  itemTitle?: string | null;
  metadata?: ItemMetadata | null;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function LinkNotePreview({ url, itemTitle, metadata }: LinkNotePreviewProps) {
  const [previewTitle, setPreviewTitle] = useState<string | null>(
    metadata?.link_title ?? null
  );
  const [image, setImage] = useState<string | null>(
    metadata?.link_image ?? null
  );
  const [description, setDescription] = useState<string | null>(
    metadata?.link_description ?? null
  );
  const [loading, setLoading] = useState(!metadata?.link_title);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (metadata?.link_title && metadata?.link_image) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/link-preview?url=${encodeURIComponent(url)}`
        );
        const data = (await res.json()) as {
          title?: string | null;
          image?: string | null;
          description?: string | null;
        };
        if (!cancelled) {
          if (!metadata?.link_title) setPreviewTitle(data.title ?? null);
          if (!metadata?.link_image) setImage(data.image ?? null);
          if (!metadata?.link_description) setDescription(data.description ?? null);
        }
      } catch {
        if (!cancelled) {
          if (!metadata?.link_title) setPreviewTitle(titleFromUrl(url));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [url, metadata]);

  const displayTitle = resolveLinkTitle(url, previewTitle, itemTitle);
  const domain = getDomain(url);

  return (
    <div
      className="group relative w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 text-left cursor-pointer active:opacity-80"
    >
      {loading ? (
        <div className="flex aspect-[16/9] items-center justify-center bg-zinc-900">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
        </div>
      ) : image && !imgError ? (
        <div className="aspect-[16/9] overflow-hidden bg-white">
          <img
            src={image}
            alt=""
            className="h-full w-full object-contain transition-transform group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <div className="flex aspect-[16/9] items-center justify-center bg-zinc-900">
          <Link2 className="h-10 w-10 text-zinc-600" />
        </div>
      )}

      <div className="space-y-1 px-4 py-3">
        <p className="line-clamp-1 text-sm font-semibold text-zinc-100">
          {displayTitle}
        </p>
        {description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-zinc-400">
            {description}
          </p>
        )}
        <p className="text-xs text-zinc-600">{domain}</p>
      </div>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="absolute right-3 top-3 z-10 p-2 opacity-0 transition-opacity group-hover:opacity-100"
        title="Abrir en nueva pestaña"
      >
        <ExternalLink className="h-4 w-4 text-zinc-600 hover:text-zinc-300" />
      </a>
    </div>
  );
}
