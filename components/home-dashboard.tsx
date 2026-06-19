"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchItems } from "@/lib/items";
import { getSignedUrl } from "@/lib/storage";
import { ItemDetail } from "@/components/item-detail";
import { displayValue, formatRelative, cn } from "@/lib/utils";
import type { Item } from "@/lib/types";

interface HomeDashboardProps {
  refreshKey?: number;
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-zinc-800">{title}</h2>
      {children}
    </section>
  );
}

function ItemRow({
  item,
  onClick,
}: {
  item: Item;
  onClick: () => void;
}) {
  const summary =
    item.metadata.summary ?? item.content?.slice(0, 80) ?? " ";

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-zinc-100 py-3 text-left last:border-b-0 active:opacity-70"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-900">
          {displayValue(item.title) === " " ? "Sin título" : item.title}
        </p>
        <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">{summary}</p>
      </div>
      <span className="shrink-0 text-[10px] text-zinc-400">
        {formatRelative(item.created_at)}
      </span>
    </button>
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

function AudioWaveform({
  bars,
  progress,
  active,
}: {
  bars: number[];
  progress: number;
  active: boolean;
}) {
  return (
    <div className="flex h-8 flex-1 items-end gap-px">
      {bars.map((h, i) => {
        const barProgress = i / bars.length;
        const lit = active && barProgress <= progress;
        return (
          <div
            key={i}
            className={cn(
              "w-1 rounded-full transition-colors duration-75",
              lit ? "bg-rose-500" : "bg-zinc-200"
            )}
            style={{ height: `${Math.round(h * 100)}%` }}
          />
        );
      })}
    </div>
  );
}

function AudioRow({
  item,
  url,
  playing,
  progress,
  onTogglePlay,
  onOpen,
}: {
  item: Item;
  url: string | null;
  playing: boolean;
  progress: number;
  onTogglePlay: () => void;
  onOpen: () => void;
}) {
  const bars = useMemo(() => seedBars(item.id, 32), [item.id]);
  const summary =
    item.metadata.summary ?? item.content?.slice(0, 60) ?? " ";

  return (
    <div className="flex items-center gap-3 border-b border-zinc-100 py-3 last:border-b-0">
      <button
        type="button"
        onClick={onTogglePlay}
        disabled={!url}
        aria-label={playing ? "Pausar" : "Reproducir"}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-700 disabled:opacity-40 active:scale-95"
      >
        {playing ? "❚❚" : "▶"}
      </button>

      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 flex-col gap-1 text-left active:opacity-70"
      >
        <p className="truncate text-sm font-semibold text-zinc-900">
          {displayValue(item.title) === " " ? "Sin título" : item.title}
        </p>
        <AudioWaveform bars={bars} progress={progress} active={playing} />
        <p className="line-clamp-1 text-[10px] text-zinc-400">{summary}</p>
      </button>

      <span className="shrink-0 text-[10px] text-zinc-400">
        {formatRelative(item.created_at)}
      </span>
    </div>
  );
}

function GalleryGrid({
  items,
  urls,
  onSelect,
}: {
  items: Item[];
  urls: Record<string, string>;
  onSelect: (item: Item) => void;
}) {
  const slots = 12;
  const visible = items.slice(0, slots);

  return (
    <div className="grid grid-cols-4 gap-1.5">
      {visible.map((item) => {
        const url = item.file_url ? urls[item.file_url] : null;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className="aspect-square overflow-hidden rounded-lg bg-zinc-100 active:opacity-80"
          >
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={item.title ?? "Imagen"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-zinc-300" />
              </div>
            )}
          </button>
        );
      })}
      {visible.length === 0 && (
        <p className="col-span-4 py-6 text-center text-sm text-zinc-400">
          Sin fotos todavía
        </p>
      )}
    </div>
  );
}

export function HomeDashboard({ refreshKey = 0 }: HomeDashboardProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const data = await fetchItems(supabase);
      setItems(data);

      const paths = [
        ...new Set(
          data
            .filter((i) => i.file_url && (i.type === "image" || i.type === "audio"))
            .map((i) => i.file_url as string)
        ),
      ];

      const entries = await Promise.all(
        paths.map(async (path) => {
          try {
            const url = await getSignedUrl(supabase, path);
            return [path, url] as const;
          } catch {
            return [path, ""] as const;
          }
        })
      );

      setMediaUrls(Object.fromEntries(entries.filter(([, url]) => url)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems, refreshKey]);

  const notes = useMemo(
    () => items.filter((i) => i.type === "note"),
    [items]
  );
  const images = useMemo(
    () => items.filter((i) => i.type === "image"),
    [items]
  );
  const audios = useMemo(
    () => items.filter((i) => i.type === "audio"),
    [items]
  );

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  function stopPlayback() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingId(null);
    setProgress(0);
  }

  function toggleAudioPlay(item: Item) {
    const path = item.file_url;
    if (!path) return;
    const url = mediaUrls[path];
    if (!url) return;

    if (playingId === item.id) {
      stopPlayback();
      return;
    }

    stopPlayback();

    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingId(item.id);

    audio.addEventListener("timeupdate", () => {
      if (audio.duration) {
        setProgress(audio.currentTime / audio.duration);
      }
    });
    audio.addEventListener("ended", () => {
      stopPlayback();
    });
    audio.addEventListener("error", () => {
      stopPlayback();
    });

    void audio.play();
  }

  function handleUpdated(updated: Item) {
    setItems((prev) =>
      prev
        .map((i) => (i.id === updated.id ? updated : i))
        .sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        })
    );
    setSelectedItem(updated);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-red-300">{error}</p>
        <button
          type="button"
          onClick={() => void loadItems()}
          className="mt-3 text-sm text-zinc-400 underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5 pb-2">
        <SectionCard title="Notas">
          {notes.length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-400">
              Sin notas todavía
            </p>
          ) : (
            <div>
              {notes.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Galería">
          <GalleryGrid
            items={images}
            urls={mediaUrls}
            onSelect={setSelectedItem}
          />
        </SectionCard>

        <SectionCard title="Audios">
          {audios.length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-400">
              Sin audios todavía
            </p>
          ) : (
            <div>
              {audios.map((item) => (
                <AudioRow
                  key={item.id}
                  item={item}
                  url={item.file_url ? mediaUrls[item.file_url] ?? null : null}
                  playing={playingId === item.id}
                  progress={playingId === item.id ? progress : 0}
                  onTogglePlay={() => toggleAudioPlay(item)}
                  onOpen={() => setSelectedItem(item)}
                />
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {selectedItem && (
        <ItemDetail
          key={selectedItem.id}
          item={selectedItem}
          open={!!selectedItem}
          onOpenChange={(open) => !open && setSelectedItem(null)}
          onUpdated={handleUpdated}
          onDeleted={() => {
            setItems((prev) => prev.filter((i) => i.id !== selectedItem.id));
            setSelectedItem(null);
          }}
        />
      )}
    </>
  );
}
