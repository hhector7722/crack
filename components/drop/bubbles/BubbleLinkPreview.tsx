"use client";

import { useEffect, useState } from "react";
import { Link2, Loader2 } from "lucide-react";
import { resolveLinkTitle, titleFromUrl } from "@/lib/link-preview";

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function BubbleLinkPreview({
  url,
  onLoad,
}: {
  url: string;
  onLoad?: () => void;
}) {
  const [title, setTitle] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/link-preview?url=${encodeURIComponent(url)}`,
        );
        const data = (await res.json()) as {
          title?: string | null;
          image?: string | null;
          description?: string | null;
        };
        if (!cancelled) {
          setTitle(data.title ?? null);
          setImage(data.image ?? null);
          setDescription(data.description ?? null);
        }
      } catch {
        if (!cancelled) setTitle(titleFromUrl(url));
      } finally {
        if (!cancelled) {
          setLoading(false);
          onLoad?.();
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
    // Solo re-fetch al cambiar la URL
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onLoad es callback de layout
  }, [url]);

  const displayTitle = resolveLinkTitle(url, title, null);
  const domain = getDomain(url);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block min-w-[220px] max-w-full overflow-hidden rounded-2xl rounded-br-sm bg-[#1c1c1e] active:opacity-80"
    >
      {loading ? (
        <div className="flex aspect-[1.9/1] items-center justify-center bg-zinc-900/80">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
        </div>
      ) : image && !imgError ? (
        <div className="aspect-[1.9/1] overflow-hidden bg-zinc-900">
          <img
            src={image}
            alt=""
            className="h-full w-full object-cover"
            onLoad={onLoad}
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <div className="flex aspect-[1.9/1] items-center justify-center bg-zinc-900/80">
          <Link2 className="h-8 w-8 text-zinc-600" />
        </div>
      )}

      <div className="space-y-0.5 px-3.5 py-2.5">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-zinc-100">
          {displayTitle}
        </p>
        {description ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-zinc-400">
            {description}
          </p>
        ) : null}
        <p className="text-[11px] text-zinc-500">{domain}</p>
      </div>
    </a>
  );
}
