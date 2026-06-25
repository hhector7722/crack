"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchItems, deleteItem } from "@/lib/items";
import { deleteFile } from "@/lib/storage";
import { ItemCard } from "@/components/item-card";
import { SwipeToDelete } from "@/components/swipe-to-delete";
import { ItemDetail } from "@/components/item-detail";
import type { Item, ItemType } from "@/lib/types";

interface ItemFeedProps {
  filter?: ItemType;
  refreshKey?: number;
}

export function ItemFeed({ filter, refreshKey = 0 }: ItemFeedProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const data = await fetchItems(supabase, filter);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando items");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const data = await fetchItems(supabase, filter);
        if (!cancelled) setItems(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error cargando items");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [filter, refreshKey]);

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
      <div className="py-20 text-center">
        <p className="text-zinc-500">No hay items todavía</p>
        <p className="mt-1 text-sm text-zinc-600">
          Usa las pestañas de abajo para crear
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="content-list">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />
        ))}
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
