"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchItems, deleteItem } from "@/lib/items";
import { deleteFile, getSignedUrl } from "@/lib/storage";
import { SwipeToDelete } from "@/components/swipe-to-delete";
import { ItemDetail } from "@/components/item-detail";
import { useLongPress } from "@/hooks/use-long-press";
import { useItemShare } from "@/hooks/use-item-share";
import { useRealtimeSubscription } from "@/hooks/use-realtime";
import type { Item } from "@/lib/types";

interface GalleryFeedProps {
  refreshKey?: number;
  columns?: number;
  limit?: number;
  compact?: boolean;
  onSelect?: (item: Item) => void;
}

function GalleryThumb({
  item,
  url,
  onSelect,
  onShare,
}: {
  item: Item;
  url: string | null;
  onSelect: () => void;
  onShare: (item: Item, mediaUrl?: string | null) => void;
}) {
  const longPress = useLongPress(() => onShare(item, url));
  const isVideo = item.type === "video";

  return (
    <button
      type="button"
      {...longPress}
      onClick={() => {
        if (longPress.consumeLongPress()) return;
        onSelect();
      }}
      className="relative aspect-square w-full overflow-hidden rounded-md bg-white shadow-sm shadow-black/40 active:opacity-80"
    >
      {url ? (
        isVideo ? (
          <>
            <video
              src={url}
              muted
              playsInline
              preload="metadata"
              className="h-full w-full object-contain"
            />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
              <Play className="h-6 w-6 fill-white text-white" />
            </span>
          </>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-contain" />
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-zinc-600" />
        </div>
      )}
    </button>
  );
}

export function GalleryFeed({
  refreshKey = 0,
  columns = 4,
  limit,
  compact,
  onSelect,
}: GalleryFeedProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const { shareItem, sheet } = useItemShare();

  const loadItems = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    setIsRefreshing(true);
    setError(null);
    try {
      const supabase = createClient();
      const data = await fetchItems(supabase, ["image", "video"]);
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

      setUrls(Object.fromEntries(entries.filter(([, url]) => url)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando galería");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadItems(items.length > 0);
  }, [loadItems, refreshKey]);

  useRealtimeSubscription(
    "items",
    (payload) => {
      const isMedia = (type: string) => type === "image" || type === "video";
      if (payload.eventType === "INSERT") {
        const newItem = payload.new as unknown as Item;
        if (isMedia(newItem.type)) {
          setItems((prev) => [newItem, ...prev]);
        }
      } else if (payload.eventType === "UPDATE") {
        const updated = payload.new as unknown as Item;
        if (isMedia(updated.type)) {
          setItems((prev) =>
            prev.map((i) => (i.id === updated.id ? { ...i, ...updated } : i))
          );
        }
      } else if (payload.eventType === "DELETE") {
        const deleted = payload.old as unknown as Item;
        if (isMedia(deleted.type)) {
          setItems((prev) => prev.filter((i) => i.id !== deleted.id));
        }
      }
    }
  );

  async function handleDelete(item: Item) {
    try {
      const supabase = createClient();
      if (item.file_url) {
        await deleteFile(supabase, item.file_url);
      }
      await deleteItem(supabase, item.id);
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

  function handleSelect(item: Item) {
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

  const visible = limit ? items.slice(0, limit) : items;

  if (visible.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-zinc-400">
        Sin fotos ni vídeos todavía
      </p>
    );
  }

  const gridCols =
    columns === 5 ? "grid-cols-5" : columns === 4 ? "grid-cols-4" : "grid-cols-3";

  return (
    <div className="mx-auto w-full pt-4 pb-20">
      <div className={`grid ${gridCols} gap-1`}>
        {isRefreshing && (
          <div className="aspect-square w-full animate-pulse rounded-md bg-zinc-800"></div>
        )}
        {visible.map((item) => {
          const url = item.file_url ? urls[item.file_url] : null;
          const thumb = (
            <GalleryThumb
              item={item}
              url={url}
              onShare={shareItem}
              onSelect={() => handleSelect(item)}
            />
          );

          return <div key={item.id}>{thumb}</div>;
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
