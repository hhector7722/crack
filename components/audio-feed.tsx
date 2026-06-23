"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchItems, deleteItem } from "@/lib/items";
import { deleteFile, getSignedUrl } from "@/lib/storage";
import { CompactAudioItem } from "@/components/compact-items";
import { usePager } from "@/components/app-shell-context";
import { SwipeToDelete } from "@/components/swipe-to-delete";
import { ItemDetail } from "@/components/item-detail";
import { useLongPress } from "@/hooks/use-long-press";
import { useItemShare } from "@/hooks/use-item-share";
import type { Item } from "@/lib/types";

interface AudioFeedProps {
  refreshKey?: number;
  compact?: boolean;
  onSelect?: (item: Item) => void;
}

function AudioRow({
  item,
  mediaUrl,
  playing,
  progress,
  onTogglePlay,
  onOpen,
  onShare,
}: {
  item: Item;
  mediaUrl: string | null;
  playing: boolean;
  progress: number;
  onTogglePlay: () => void;
  onOpen?: () => void;
  onShare: (item: Item, mediaUrl?: string | null) => void;
}) {
  const longPress = useLongPress(() => onShare(item, mediaUrl));

  return (
    <div {...longPress} className="h-full">
      <CompactAudioItem
        item={item}
        playing={playing}
        progress={progress}
        onTogglePlay={() => {
          if (longPress.consumeLongPress()) return;
          onTogglePlay();
        }}
        onClick={
          onOpen
            ? () => {
                if (longPress.consumeLongPress()) return;
                onOpen();
              }
            : undefined
        }
      />
    </div>
  );
}

export function AudioFeed({ refreshKey = 0, compact, onSelect }: AudioFeedProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef(0);
  const { shareItem, sheet } = useItemShare();

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const data = await fetchItems(supabase, "audio");
      setItems(data);

      const paths = [
        ...new Set(
          data.filter((i) => i.file_url).map((i) => i.file_url as string)
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
      setError(err instanceof Error ? err.message : "Error cargando audios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems, refreshKey]);

  useEffect(() => {
    return () => {
      stopProgressLoop();
      audioRef.current?.pause();
    };
  }, []);

  function stopProgressLoop() {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  }

  function updateProgress(audio: HTMLAudioElement) {
    const duration = audio.duration;
    if (Number.isFinite(duration) && duration > 0) {
      setProgress(Math.min(1, audio.currentTime / duration));
    }
  }

  function startProgressLoop(audio: HTMLAudioElement) {
    stopProgressLoop();

    const tick = () => {
      if (audioRef.current !== audio || audio.paused || audio.ended) {
        return;
      }
      updateProgress(audio);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }

  function stopPlayback() {
    stopProgressLoop();
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
    setProgress(0);

    audio.addEventListener("loadedmetadata", () => updateProgress(audio));
    audio.addEventListener("durationchange", () => updateProgress(audio));
    audio.addEventListener("timeupdate", () => updateProgress(audio));
    audio.addEventListener("play", () => startProgressLoop(audio));
    audio.addEventListener("pause", stopProgressLoop);
    audio.addEventListener("ended", () => stopPlayback());
    audio.addEventListener("error", () => stopPlayback());

    void audio.play().catch(() => stopPlayback());
  }

  async function handleDelete(item: Item) {
    try {
      const supabase = createClient();
      if (item.file_url) {
        await deleteFile(supabase, item.file_url);
      }
      await deleteItem(supabase, item.id);
      if (playingId === item.id) stopPlayback();
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error eliminando");
    }
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

  function handleOpen(item: Item) {
    if (onSelect) {
      onSelect(item);
      return;
    }
    setSelectedItem(item);
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
          className="mt-3 inline-flex items-center gap-2 text-sm text-zinc-400 underline"
        >
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-zinc-400">
        Sin audios todavía
      </p>
    );
  }

  const listClass = compact ? "divide-y divide-zinc-700/50" : "grid grid-cols-2 gap-4 px-4 pt-2";

  return (
    <div className="mx-auto flex min-h-full w-full flex-col pt-[var(--tm-app-header-block)]">
      <div className={listClass}>
        {items.map((item) => {
          const mediaUrl = item.file_url ? mediaUrls[item.file_url] ?? null : null;
          const row = (
            <AudioRow
              item={item}
              mediaUrl={mediaUrl}
              playing={playingId === item.id}
              progress={playingId === item.id ? progress : 0}
              onTogglePlay={() => toggleAudioPlay(item)}
              onOpen={onSelect ? () => handleOpen(item) : undefined}
              onShare={shareItem}
            />
          );

          if (compact) {
            return <div key={item.id}>{row}</div>;
          }

          return (
            <SwipeToDelete key={item.id} onDelete={() => handleDelete(item)}>
              {row}
            </SwipeToDelete>
          );
        })}
      </div>


      {selectedItem && !onSelect && (
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

      {sheet}
    </div>
  );
}
