"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchItems, deleteItem } from "@/lib/items";
import { deleteFile, getSignedUrl } from "@/lib/storage";
import { SwipeToDelete } from "@/components/swipe-to-delete";
import { ItemDetail } from "@/components/item-detail";
import { useLongPress } from "@/hooks/use-long-press";
import { useItemShare } from "@/hooks/use-item-share";
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

  return (
    <button
      type="button"
      {...longPress}
      onClick={() => {
        if (longPress.consumeLongPress()) return;
        onSelect();
      }}
      className="aspect-square w-full overflow-hidden rounded-md bg-white shadow-sm shadow-black/40 active:opacity-80"
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-contain" />
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
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const { shareItem, sheet } = useItemShare();

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const data = await fetchItems(supabase, "image");
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
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems, refreshKey]);

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
        Sin fotos todavía
      </p>
    );
  }

  const gridCols =
    columns === 5 ? "grid-cols-5" : columns === 4 ? "grid-cols-4" : "grid-cols-3";

  return (
    <div className="mx-auto flex min-h-full w-full flex-col pt-[var(--tm-app-header-block)]">
      <div className={`grid ${gridCols} gap-1`}>
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

          if (compact) {
            return <div key={item.id}>{thumb}</div>;
          }

          return (
            <SwipeToDelete key={item.id} onDelete={() => handleDelete(item)}>
              {thumb}
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
