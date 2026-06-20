"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Link2, Loader2 } from "lucide-react";
import { resolveLinkTitle, titleFromUrl } from "@/lib/link-preview";
import { cn } from "@/lib/utils";

interface LinkNotePreviewProps {
  url: string;
  itemTitle?: string | null;
}

export function LinkNotePreview({ url, itemTitle }: LinkNotePreviewProps) {
  const [previewTitle, setPreviewTitle] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        };
        if (!cancelled) {
          setPreviewTitle(data.title ?? null);
          setImage(data.image ?? null);
        }
      } catch {
        if (!cancelled) {
          setPreviewTitle(titleFromUrl(url));
          setImage(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [url]);

  const displayTitle = resolveLinkTitle(url, previewTitle, itemTitle);

  function openLink(e: React.MouseEvent) {
    e.stopPropagation();
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-900 shadow-sm shadow-black/40">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
        ) : image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setImage(null)}
          />
        ) : (
          <Link2 className="h-6 w-6 text-zinc-500" />
        )}
      </div>

      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-100">
        {displayTitle}
      </p>

      <button
        type="button"
        onClick={openLink}
        aria-label="Abrir enlace"
        className="flex h-9 w-9 shrink-0 items-center justify-center text-zinc-300 active:opacity-60"
      >
        <ExternalLink className="h-5 w-5" strokeWidth={2} />
      </button>
    </div>
  );
}
