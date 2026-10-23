"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSignedUrl } from "@/lib/storage";
import { cn, getNoteUrl } from "@/lib/utils";
import type { Item } from "@/lib/types";

function youtubeThumbnail(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const id =
      host === "youtu.be" || host === "www.youtu.be"
        ? parsed.pathname.split("/")[1]
        : host === "youtube.com" || host === "www.youtube.com" || host === "m.youtube.com"
          ? parsed.pathname.startsWith("/shorts/")
            ? parsed.pathname.split("/")[2]
            : parsed.searchParams.get("v")
          : null;
    return id && /^[\w-]{11}$/.test(id)
      ? `https://img.youtube.com/vi/${id}/hqdefault.jpg`
      : null;
  } catch {
    return null;
  }
}

export function LinkCover({
  item,
  className,
  imageClassName,
}: {
  item: Item;
  className?: string;
  imageClassName?: string;
}) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState<string[]>([]);
  const path = item.metadata.link_image_path;
  const external = item.metadata.link_image ?? null;
  const linkUrl = getNoteUrl(item);

  useEffect(() => {
    let cancelled = false;
    if (!path) return;
    void getSignedUrl(createClient(), path)
      .then((url) => {
        if (!cancelled) setSignedUrl(url);
      })
      .catch(() => {
        if (!cancelled) setSignedUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  const sources = [
    ...(path && signedUrl ? [signedUrl] : []),
    ...(external ? [external] : []),
    youtubeThumbnail(linkUrl),
  ].filter((url): url is string => Boolean(url));
  const image = sources.find((source) => !failed.includes(source));

  let domain = "ENLACE";
  try {
    domain = new URL(linkUrl ?? "").hostname.replace(/^www\./, "").toUpperCase();
  } catch {
    // Enlaces antiguos sin hostname interpretable.
  }

  return (
    <div className={cn("relative flex h-full w-full items-center justify-center overflow-hidden bg-zinc-900", className)}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={image}
          src={image}
          alt=""
          loading="lazy"
          className={cn("h-full w-full object-cover", imageClassName)}
          onError={() => setFailed((current) => [...current, image])}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 px-3">
          <span className="max-w-full truncate text-center text-[11px] font-medium tracking-wide text-zinc-500">
            {domain}
          </span>
        </div>
      )}
    </div>
  );
}
