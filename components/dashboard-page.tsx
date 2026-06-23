"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { Loader2, Mic, ImageIcon, FileText, Link2, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchItems } from "@/lib/items";
import { getSignedUrl } from "@/lib/storage";
import { usePager } from "@/components/app-shell-context";
import { displayValue, getNoteUrl } from "@/lib/utils";
import type { Item } from "@/lib/types";
import { AudioWaveform } from "@/components/audio-item-row";
import { resolveLinkTitle, titleFromUrl } from "@/lib/link-preview";

interface DashboardPageProps {
  refreshKey?: number;
}

type Categorized = {
  audios: Item[];
  images: Item[];
  notes: Item[];
  links: Item[];
};

function SectionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-[32px] bg-[#1c1c1e] p-4">
      {children}
    </section>
  );
}

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

function CompactAudioItem({ item }: { item: Item }) {
  const bars = useMemo(() => seedBars(item.id, 24), [item.id]);
  const transcript =
    item.metadata.raw_transcript ??
    item.metadata.summary ??
    item.content ??
    "Audio";

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-zinc-800/40 p-3 transition-colors active:bg-zinc-800/60">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Reproducir"
          className="flex h-8 w-8 shrink-0 items-center justify-center text-xs font-bold text-zinc-200"
        >
          ▶
        </button>
        <div className="flex-1">
          <AudioWaveform bars={bars} progress={0} active={false} />
        </div>
      </div>
      <p className="line-clamp-1 text-[11px] text-zinc-500">
        {transcript}
      </p>
    </div>
  );
}

function ImageThumb({ url }: { url: string | null }) {
  return (
    <div className="aspect-square w-full overflow-hidden rounded-xl bg-zinc-800/50">
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover transition-transform active:scale-95" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-zinc-600" />
        </div>
      )}
    </div>
  );
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function CompactLinkItem({ item }: { item: Item }) {
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
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        if (!cancelled) {
          if (!item.metadata?.link_title) setPreviewTitle(data.title ?? null);
          if (!item.metadata?.link_image) setImage(data.image ?? null);
          if (!item.metadata?.link_description) setDescription(data.description ?? null);
        }
      } catch {
        if (!cancelled) {
          if (!item.metadata?.link_title) setPreviewTitle(titleFromUrl(url));
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

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 overflow-hidden rounded-xl bg-zinc-800/40 p-2.5 transition-colors active:bg-zinc-800/60"
    >
      <div className="aspect-square h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-zinc-800/50">
        {loading ? (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-3 w-3 animate-spin text-zinc-600" />
          </div>
        ) : image && !imgError ? (
          <img
            src={image}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Link2 className="h-4 w-4 text-zinc-600" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <p className="truncate text-xs font-semibold text-zinc-100">{displayTitle}</p>
        <p className="truncate text-[10px] text-zinc-400">{bodyText}</p>
      </div>
    </a>
  );
}

export function DashboardPage({ refreshKey = 0 }: DashboardPageProps) {
  const [categorized, setCategorized] = useState<Categorized | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      const [audios, images, notes] = await Promise.all([
        fetchItems(supabase, "audio", { limit: 4 }), // Just 4 for compact grid
        fetchItems(supabase, "image", { limit: 10 }), // 10 for 2x5 grid
        fetchItems(supabase, "note", { limit: 20 }),
      ]);

      const noteItems = notes.filter((i) => !getNoteUrl(i));
      const linkItems = notes.filter((i) => getNoteUrl(i));

      setCategorized({ audios, images, notes: noteItems, links: linkItems });

      const imgPaths = [...new Set(images.filter((i) => i.file_url).map((i) => i.file_url!))];
      const audioPaths = [...new Set(audios.filter((i) => i.file_url).map((i) => i.file_url!))];

      const [imgEntries, audioEntries] = await Promise.all([
        Promise.all(imgPaths.map(async (p) => [p, await getSignedUrl(supabase, p).catch(() => "")] as const)),
        Promise.all(audioPaths.map(async (p) => [p, await getSignedUrl(supabase, p).catch(() => "")] as const)),
      ]);

      setImageUrls(Object.fromEntries(imgEntries.filter(([, url]) => url)));
      setAudioUrls(Object.fromEntries(audioEntries.filter(([, url]) => url)));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!categorized) return null;

  return (
    <div className="space-y-4 px-2 pb-8 pt-4">
      {categorized.audios.length > 0 && (
        <SectionWrapper>
          <div className="grid grid-cols-2 gap-4">
            {categorized.audios.slice(0, 4).map((item) => (
              <CompactAudioItem key={item.id} item={item} />
            ))}
          </div>
        </SectionWrapper>
      )}

      {categorized.images.length > 0 && (
        <SectionWrapper>
          <div className="grid grid-cols-5 gap-2">
            {categorized.images.slice(0, 10).map((item) => (
              <ImageThumb
                key={item.id}
                url={item.file_url ? imageUrls[item.file_url] ?? null : null}
              />
            ))}
          </div>
        </SectionWrapper>
      )}

      {categorized.notes.length > 0 && (
        <SectionWrapper>
          <div className="divide-y divide-zinc-800/50">
            {categorized.notes.slice(0, 5).map((item) => (
              <div key={item.id} className="py-2.5 first:pt-0 last:pb-0">
                <p className="line-clamp-1 text-sm font-medium text-zinc-100">
                  {displayValue(item.title)}
                </p>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-400">
                  {item.metadata.summary ?? item.content ?? ""}
                </p>
              </div>
            ))}
          </div>
        </SectionWrapper>
      )}

      {categorized.links.length > 0 && (
        <SectionWrapper>
          <div className="grid grid-cols-2 gap-2">
            {categorized.links.slice(0, 4).map((item) => (
              <CompactLinkItem key={item.id} item={item} />
            ))}
          </div>
        </SectionWrapper>
      )}
    </div>
  );
}

