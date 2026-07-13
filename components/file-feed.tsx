"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchItems } from "@/lib/items";
import { CompactFileItem } from "@/components/compact-items";
import { ItemDetail } from "@/components/item-detail";
import { useLongPress } from "@/hooks/use-long-press";
import { useItemShare } from "@/hooks/use-item-share";
import { useRealtimeSubscription } from "@/hooks/use-realtime";
import type { Item } from "@/lib/types";

interface FileFeedProps {
  refreshKey?: number;
  onSelect?: (item: Item) => void;
}

function FileRow({
  item,
  onClick,
  onShare,
}: {
  item: Item;
  onClick: () => void;
  onShare: (item: Item) => void;
}) {
  const longPress = useLongPress(() => onShare(item));

  return (
    <div {...longPress} className="content-row">
      <CompactFileItem
        item={item}
        onClick={() => {
          if (longPress.consumeLongPress()) return;
          onClick();
        }}
      />
    </div>
  );
}

export function FileFeed({ refreshKey = 0, onSelect }: FileFeedProps) {
  const [items, setItems] = useState<Item[]>([]);
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
      const data = await fetchItems(supabase, "file");
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando archivos");
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
      if (payload.eventType === "INSERT") {
        const newItem = payload.new as unknown as Item;
        if (newItem.type === "file") {
          setItems((prev) => [newItem, ...prev]);
        }
      } else if (payload.eventType === "UPDATE") {
        const updated = payload.new as unknown as Item;
        setItems((prev) =>
          prev.map((i) => (i.id === updated.id ? { ...i, ...updated } : i))
        );
      } else if (payload.eventType === "DELETE") {
        const deleted = payload.old as unknown as Item;
        setItems((prev) => prev.filter((i) => i.id !== deleted.id));
      }
    },
    "type=eq.file"
  );

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

  function handleClick(item: Item) {
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
        Sin archivos todavía
      </p>
    );
  }

  return (
    <div className="mx-auto w-full pt-4 pb-20">
      <div className="content-list px-4">
        {isRefreshing && (
          <div className="flex w-full animate-pulse py-3">
            <div className="h-4 w-2/3 rounded bg-zinc-800" />
          </div>
        )}
        {items.map((item) => (
          <FileRow
            key={item.id}
            item={item}
            onShare={shareItem}
            onClick={() => handleClick(item)}
          />
        ))}
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
