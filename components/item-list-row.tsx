"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Link2,
  Mic,
  Paperclip,
  Pin,
  Play,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSignedUrl } from "@/lib/storage";
import {
  cn,
  decodeHtmlEntities,
  displayValue,
  formatRelative,
  getNoteUrl,
} from "@/lib/utils";
import type { Item } from "@/lib/types";

function getKind(item: Item) {
  if (getNoteUrl(item)) return "Enlace";
  if (item.type === "image" || item.type === "video") {
    return item.type === "video" ? "Vídeo" : "Foto";
  }
  if (item.type === "audio") return "Audio";
  if (item.type === "file") return "Archivo";
  return "Nota";
}

function getDomain(url: string | null) {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function getFileExtension(item: Item) {
  const source = item.file_url || item.title || "";
  const clean = source.split("?")[0];
  const name = clean.split("/").pop() || clean;
  const ext = name.includes(".") ? name.split(".").pop() : "";
  return (ext || "FILE").toUpperCase().slice(0, 5);
}

function getDisplayTitle(item: Item) {
  const linkUrl = getNoteUrl(item);
  const rawTitle =
    displayValue(item.title) === " "
      ? ""
      : item.title?.trim() || item.metadata.link_title?.trim() || "";
  return decodeHtmlEntities(rawTitle || linkUrl || getKind(item));
}

function getSummary(item: Item) {
  return decodeHtmlEntities(
    item.metadata.summary || item.content || getKind(item)
  );
}

function seedBars(id: string, count: number) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }

  return Array.from({ length: count }, (_, index) => {
    const n = Math.abs(Math.sin(hash * (index + 1) * 12.9898) * 43758.5453);
    return 0.24 + (n - Math.floor(n)) * 0.76;
  });
}

function useMediaUrl(item: Item) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!item.file_url) {
      setUrl(null);
      return;
    }

    let cancelled = false;
    const supabase = createClient();

    void getSignedUrl(supabase, item.file_url)
      .then((signedUrl) => {
        if (!cancelled) setUrl(signedUrl);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [item.file_url]);

  return url;
}

function RemoteImage({
  src,
  alt,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  className: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

function ItemVisual({
  item,
  mediaUrl,
}: {
  item: Item;
  mediaUrl: string | null;
}) {
  const linkUrl = getNoteUrl(item);
  const domain = getDomain(linkUrl);
  const summary = getSummary(item);
  const bars = useMemo(() => seedBars(item.id, 18), [item.id]);

  if (item.type === "image" && mediaUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={mediaUrl} alt="" className="h-full w-full object-cover" />
    );
  }

  if (item.type === "video" && mediaUrl) {
    return (
      <div className="relative h-full w-full bg-black">
        <video
          src={mediaUrl}
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/15">
          <Play className="h-5 w-5 fill-white text-white drop-shadow" />
        </span>
      </div>
    );
  }

  if (linkUrl) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-zinc-900">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-2 text-zinc-500">
          <Link2 className="h-5 w-5" />
          <span className="max-w-full truncate text-[9px] font-medium">
            {domain || "Enlace"}
          </span>
        </div>
        <RemoteImage
          src={item.metadata.link_image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    );
  }

  if (item.type === "audio") {
    return (
      <div className="flex h-full w-full items-center gap-2 bg-zinc-900 px-2.5">
        <Mic className="h-4 w-4 shrink-0 text-zinc-500" />
        <div className="flex h-7 min-w-0 flex-1 items-center gap-[2px]">
          {bars.map((bar, index) => (
            <span
              key={index}
              className="min-w-0 flex-1 rounded-full bg-zinc-600"
              style={{ height: Math.round(bar * 100) + "%" }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (item.type === "file") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-zinc-900 text-zinc-500">
        <Paperclip className="h-4 w-4" />
        <span className="text-[11px] font-bold tracking-wide text-zinc-300">
          {getFileExtension(item)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col justify-between bg-zinc-900 p-2">
      <FileText className="h-4 w-4 text-zinc-500" />
      <p className="line-clamp-3 text-[9px] font-medium leading-tight text-zinc-300">
        {summary || "Nota"}
      </p>
    </div>
  );
}

export function CompactItemTile({
  item,
  onOpen,
}: {
  item: Item;
  onOpen: () => void;
}) {
  const mediaUrl = useMediaUrl(item);
  const title = getDisplayTitle(item);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-36 shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/65 text-left active:bg-zinc-800"
    >
      <div className="relative h-16 w-full overflow-hidden bg-zinc-900">
        <ItemVisual item={item} mediaUrl={mediaUrl} />
        {item.pinned ? (
          <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-zinc-100 backdrop-blur-sm">
            <Pin className="h-3.5 w-3.5 fill-current" />
          </span>
        ) : null}
      </div>
      <div className="px-2.5 py-1.5">
        <p className="line-clamp-1 text-xs font-semibold text-zinc-100">
          {title}
        </p>
        <span className="mt-0.5 block text-[10px] text-zinc-500">
          {getKind(item)}
        </span>
      </div>
    </button>
  );
}

export function ItemListRow({
  item,
  onOpen,
  compact = false,
}: {
  item: Item;
  onOpen: () => void;
  compact?: boolean;
}) {
  const mediaUrl = useMediaUrl(item);
  const title = getDisplayTitle(item);
  const summary = getSummary(item);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        "group flex w-full items-center border-b border-zinc-800/70 text-left outline-none active:opacity-70 focus-visible:ring-2 focus-visible:ring-zinc-500",
        compact ? "min-h-[4.25rem] gap-2.5 py-2" : "min-h-20 gap-3 py-2.5"
      )}
    >
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-xl bg-zinc-900",
          compact ? "h-[3.25rem] w-[3.25rem]" : "h-16 w-16"
        )}
      >
        <ItemVisual item={item} mediaUrl={mediaUrl} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-100">
            {title}
          </p>
          {item.pinned ? (
            <Pin className="mt-0.5 h-3.5 w-3.5 shrink-0 fill-zinc-300 text-zinc-300" />
          ) : null}
        </div>

        {!compact && summary ? (
          <p className="mt-1 line-clamp-1 text-xs text-zinc-500">{summary}</p>
        ) : null}

        <div className="mt-1 flex items-center gap-2 text-[10px] text-zinc-600">
          <span>{getKind(item)}</span>
          <span aria-hidden>·</span>
          <span>{formatRelative(item.created_at)}</span>
        </div>

        {!compact && item.type === "audio" && mediaUrl ? (
          <audio
            controls
            preload="none"
            src={mediaUrl}
            className={cn("mt-2 h-9 w-full max-w-sm", "[color-scheme:dark]")}
            onClick={(event) => event.stopPropagation()}
          />
        ) : null}
      </div>
    </div>
  );
}
