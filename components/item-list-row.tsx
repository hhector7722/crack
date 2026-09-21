"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  Link2,
  Mic,
  Paperclip,
  Pin,
  Play,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSignedUrl } from "@/lib/storage";
import { displayValue, formatRelative, getNoteUrl, cn } from "@/lib/utils";
import type { Item } from "@/lib/types";

function getKind(item: Item) {
  if (getNoteUrl(item)) return "Enlace";
  if (item.type === "image" || item.type === "video") return item.type === "video" ? "Vídeo" : "Foto";
  if (item.type === "audio") return "Audio";
  if (item.type === "file") return "Archivo";
  return "Nota";
}

function KindIcon({ item }: { item: Item }) {
  if (getNoteUrl(item)) return <Link2 className="h-4 w-4" />;
  if (item.type === "image" || item.type === "video") return <ImageIcon className="h-4 w-4" />;
  if (item.type === "audio") return <Mic className="h-4 w-4" />;
  if (item.type === "file") return <Paperclip className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
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
    void getSignedUrl(supabase, item.file_url).then((signedUrl) => {
      if (!cancelled) setUrl(signedUrl);
    }).catch(() => {
      if (!cancelled) setUrl(null);
    });
    return () => {
      cancelled = true;
    };
  }, [item.file_url]);

  return url;
}

export function CompactItemTile({ item, onOpen }: { item: Item; onOpen: () => void }) {
  const mediaUrl = useMediaUrl(item);
  const linkUrl = getNoteUrl(item);
  const title = displayValue(item.title) === " " ? "Sin título" : item.title;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-32 w-40 shrink-0 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3 text-left active:bg-zinc-800"
    >
      <div className="mb-2 flex min-h-8 items-start justify-between gap-2 text-zinc-500">
        <KindIcon item={item} />
        {item.pinned ? <Pin className="h-4 w-4 fill-zinc-300 text-zinc-300" /> : null}
      </div>
      {mediaUrl && (item.type === "image" || item.type === "video") ? (
        <div className="relative mb-2 min-h-0 flex-1 overflow-hidden rounded-lg bg-black">
          {item.type === "video" ? (
            <>
              <video src={mediaUrl} muted playsInline preload="metadata" className="h-full w-full object-cover" />
              <Play className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 fill-white text-white" />
            </>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl} alt="" className="h-full w-full object-cover" />
          )}
        </div>
      ) : (
        <p className="line-clamp-2 min-h-0 flex-1 text-sm font-semibold leading-snug text-zinc-100">
          {title || (linkUrl ? linkUrl : getKind(item))}
        </p>
      )}
      <span className="mt-1 text-[11px] text-zinc-500">{getKind(item)}</span>
    </button>
  );
}

export function ItemListRow({ item, onOpen }: { item: Item; onOpen: () => void }) {
  const mediaUrl = useMediaUrl(item);
  const linkUrl = getNoteUrl(item);
  const title = displayValue(item.title) === " " ? "Sin título" : item.title;
  const summary = item.metadata.summary || item.content || getKind(item);

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
      className="group flex min-h-20 w-full items-center gap-3 border-b border-zinc-800/70 py-3 text-left outline-none active:opacity-70 focus-visible:ring-2 focus-visible:ring-zinc-500"
    >
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-900 text-zinc-500">
        {mediaUrl && item.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl} alt="" className="h-full w-full object-cover" />
        ) : mediaUrl && item.type === "video" ? (
          <>
            <video src={mediaUrl} muted playsInline preload="metadata" className="h-full w-full object-cover" />
            <Play className="absolute h-5 w-5 fill-white text-white" />
          </>
        ) : (
          <KindIcon item={item} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-zinc-100">
            {title || linkUrl || getKind(item)}
          </p>
          {item.pinned ? <Pin className="h-3.5 w-3.5 shrink-0 fill-zinc-300 text-zinc-300" /> : null}
        </div>
        <p className="mt-1 line-clamp-1 text-xs text-zinc-500">
          {linkUrl ? linkUrl.replace(/^https?:\/\//, "") : summary}
        </p>
        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-zinc-600">
          <span>{getKind(item)}</span>
          <span aria-hidden>·</span>
          <span>{formatRelative(item.created_at)}</span>
        </div>
        {item.type === "audio" && mediaUrl ? (
          <audio
            controls
            preload="none"
            src={mediaUrl}
            className={cn("mt-2 h-10 w-full max-w-sm", "[color-scheme:dark]")}
            onClick={(event) => event.stopPropagation()}
          />
        ) : null}
      </div>
    </div>
  );
}
