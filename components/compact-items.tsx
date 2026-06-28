"use client";

import { useMemo, useState, useEffect } from "react";
import { Loader2, Link2, FileText } from "lucide-react";
import { AudioWaveform } from "@/components/audio-item-row";
import { resolveLinkTitle, titleFromUrl } from "@/lib/link-preview";
import { displayValue, getNoteUrl } from "@/lib/utils";
import type { Item } from "@/lib/types";

function seedBars(id: string, count: number): number[] {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Array.from({ length: count }, (_, i) => {
    const n = Math.abs(Math.sin(hash * (i + 1) * 12.9898) * 43758.5453);
    return 0.25 + (n - Math.floor(n)) * 0.75;
  });
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function CompactAudioItem({
  item,
  playing = false,
  progress = 0,
  onTogglePlay,
  onClick,
}: {
  item: Item;
  playing?: boolean;
  progress?: number;
  onTogglePlay?: () => void;
  onClick?: () => void;
}) {
  const bars = useMemo(() => seedBars(item.id, 24), [item.id]);
  const transcript =
    item.metadata.raw_transcript ??
    item.metadata.summary ??
    item.content ??
    "Audio";

  return (
    <div
      className="flex items-center gap-3 py-1 cursor-pointer w-full text-left active:opacity-70"
      onClick={onClick}
    >
      <button
        type="button"
        aria-label={playing ? "Pausar" : "Reproducir"}
        onClick={(e) => {
          e.stopPropagation();
          onTogglePlay?.();
        }}
        className="flex h-8 w-8 shrink-0 items-center justify-center text-xs font-bold text-zinc-200"
      >
        {playing ? "❚❚" : "▶"}
      </button>
      <div className="flex min-w-0 flex-1 flex-col text-left">
        <div className="w-full">
          <AudioWaveform bars={bars} progress={progress} active={playing} />
        </div>
        <p className="mt-1.5 line-clamp-1 text-[10px] text-zinc-500">
          {transcript}
        </p>
      </div>
    </div>
  );
}

export function CompactLinkItem({ item, onClick }: { item: Item; onClick?: () => void }) {
  const url = getNoteUrl(item);
  const [previewTitle, setPreviewTitle] = useState<string | null>(item.metadata?.link_title ?? null);
  const [image, setImage] = useState<string | null>(item.metadata?.link_image ?? null);
  const [description, setDescription] = useState<string | null>(item.metadata?.link_description ?? null);
  const [loading, setLoading] = useState(!item.metadata?.link_title);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!url) return;
    if (item.metadata?.link_title && item.metadata?.link_image) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url!)}`);
        const data = await res.json();
        if (!cancelled) {
          if (!item.metadata?.link_title) setPreviewTitle(data.title ?? null);
          if (!item.metadata?.link_image) setImage(data.image ?? null);
          if (!item.metadata?.link_description) setDescription(data.description ?? null);
        }
      } catch {
        if (!cancelled) {
          if (!item.metadata?.link_title) setPreviewTitle(titleFromUrl(url!));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [url, item.metadata]);

  if (!url) return null;
  const displayTitle = resolveLinkTitle(url, previewTitle, item.title);
  const domain = getDomain(url);
  const bodyText = description || domain;

  const inner = (
    <>
      {loading ? (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-900">
          <Loader2 className="h-3 w-3 animate-spin text-zinc-600" />
        </div>
      ) : image && !imgError ? (
        <img
          src={image}
          alt=""
          className="max-h-10 max-w-10 rounded-lg"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-900">
          <Link2 className="h-4 w-4 text-zinc-600" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-center text-left">
        <p className="truncate text-xs font-semibold text-zinc-100">{displayTitle}</p>
        <p className="truncate text-[10px] text-zinc-400">{bodyText}</p>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-3 overflow-hidden py-1 transition-opacity active:opacity-70 w-full"
      >
        {inner}
      </button>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 overflow-hidden py-1 transition-opacity active:opacity-70 w-full"
    >
      {inner}
    </a>
  );
}

export function CompactNoteItem({ item, onClick }: { item: Item; onClick?: () => void }) {
  const inner = (
    <div className="flex min-w-0 flex-col text-left">
      <p className="line-clamp-1 text-[11px] font-semibold text-zinc-100">
        {displayValue(item.title)}
      </p>
      <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-zinc-400">
        {item.metadata.summary ?? item.content ?? ""}
      </p>
    </div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="w-full text-left active:opacity-70 py-1">
        {inner}
      </button>
    );
  }

  return <div className="py-1">{inner}</div>;
}

export function CompactFileItem({ item, onClick }: { item: Item; onClick?: () => void }) {
  const inner = (
    <div className="flex items-center gap-3 w-full text-left">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-900">
        <FileText className="h-4 w-4 text-zinc-400" />
      </div>
      <div className="flex min-w-0 flex-col">
        <p className="line-clamp-1 text-[11px] font-semibold text-zinc-100">
          {displayValue(item.title) || "Documento"}
        </p>
        <p className="mt-0.5 line-clamp-1 text-[10px] text-zinc-400">
          {item.metadata.summary ?? "Archivo"}
        </p>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="w-full text-left active:opacity-70 py-1">
        {inner}
      </button>
    );
  }

  return <div className="py-1">{inner}</div>;
}
