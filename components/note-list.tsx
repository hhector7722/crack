"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchItems, deleteItem } from "@/lib/items";
import { deleteFile } from "@/lib/storage";
import { SwipeToDelete } from "@/components/swipe-to-delete";
import { ItemDetail } from "@/components/item-detail";
import { displayValue, getNoteUrl, cn } from "@/lib/utils";
import type { Item } from "@/lib/types";

interface NoteListProps {
  refreshKey?: number;
  compact?: boolean;
  light?: boolean;
  onSelect?: (item: Item) => void;
}

function NoteRow({
  item,
  compact,
  light,
  onClick,
}: {
  item: Item;
  compact?: boolean;
  light?: boolean;
  onClick: () => void;
}) {
  const url = getNoteUrl(item);
  const summary =
    item.metadata.summary ?? item.content?.slice(0, 120) ?? " ";
  const title = displayValue(item.title) === " " ? "Sin título" : item.title;

  function handleClick() {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    onClick();
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="flex w-full py-3 text-left last:border-b-0 active:opacity-70"
      >
        <p
          className={cn(
            "line-clamp-2 text-sm",
            light ? "text-zinc-600" : "text-zinc-300"
          )}
        >
          {summary}
        </p>
      </button>
    );
  }

  return (
    <button type="button" onClick={handleClick} className="content-row">
      <h3 className="truncate font-semibold text-zinc-100">{title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{summary}</p>
    </button>
  );
}

export function NoteList({ refreshKey = 0, compact, light, onSelect }: NoteListProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const data = await fetchItems(supabase, "note");
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando notas");
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
        Sin notas todavía
      </p>
    );
  }

  const listClass = compact ? "divide-y divide-zinc-100" : "content-list";

  return (
    <>
      <div className={listClass}>
        {items.map((item) =>
          compact ? (
            <NoteRow
              key={item.id}
              item={item}
              compact
              light={light}
              onClick={() => handleClick(item)}
            />
          ) : (
            <SwipeToDelete key={item.id} onDelete={() => handleDelete(item)}>
              <NoteRow item={item} onClick={() => handleClick(item)} />
            </SwipeToDelete>
          )
        )}
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
    </>
  );
}
