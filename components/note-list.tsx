"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchItems, deleteItem } from "@/lib/items";
import { deleteFile } from "@/lib/storage";
import { SwipeToDelete } from "@/components/swipe-to-delete";
import { ItemDetail } from "@/components/item-detail";
import { LinkNotePreview } from "@/components/link-note-preview";
import { useLongPress } from "@/hooks/use-long-press";
import { useItemShare } from "@/hooks/use-item-share";
import { displayValue, getNoteUrl, cn } from "@/lib/utils";
import { themeColor, themeLabel, type Item, type Theme } from "@/lib/types";

interface NoteListProps {
  refreshKey?: number;
  compact?: boolean;
  onSelect?: (item: Item) => void;
  filterType?: "note" | "link";
}

function NoteRow({
  item,
  compact,
  onClick,
  onShare,
}: {
  item: Item;
  compact?: boolean;
  onClick: () => void;
  onShare: (item: Item) => void;
}) {
  const url = getNoteUrl(item);
  const summary =
    item.metadata.summary ?? item.content?.slice(0, 120) ?? " ";
  const title = displayValue(item.title) === " " ? "Sin título" : item.title;
  const longPress = useLongPress(() => onShare(item));

  function handleActivate(action: () => void) {
    if (longPress.consumeLongPress()) return;
    action();
  }

  if (url) {
    return (
      <div
        className={compact ? undefined : "content-row"}
        {...longPress}
        onClick={() => handleActivate(onClick)}
      >
        <LinkNotePreview url={url} itemTitle={item.title} metadata={item.metadata} />
      </div>
    );
  }

  if (compact) {
    return (
      <button
        type="button"
        {...longPress}
        onClick={() => handleActivate(onClick)}
        className="flex w-full py-3 text-left last:border-b-0 active:opacity-70"
      >
        <p className="line-clamp-2 text-sm text-zinc-300">{summary}</p>
      </button>
    );
  }

  return (
    <button
      type="button"
      {...longPress}
      onClick={() => handleActivate(onClick)}
      className="content-row"
    >
      <h3 className="truncate font-semibold text-zinc-100">{title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{summary}</p>
      {(item.metadata.themes ?? []).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(item.metadata.themes ?? []).map((theme) => (
            <span
              key={theme}
              className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-medium", themeColor(theme as Theme))}
            >
              {themeLabel(theme as Theme)}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

export function NoteList({ refreshKey = 0, compact, onSelect, filterType }: NoteListProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const { shareItem, sheet } = useItemShare();

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

  function hasUrl(item: Item): boolean {
    const url = getNoteUrl(item);
    return !!url;
  }

  const filtered =
    filterType === "link"
      ? items.filter(hasUrl)
      : filterType === "note"
        ? items.filter((i) => !hasUrl(i))
        : items;

  if (filtered.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-zinc-400">
        {filterType === "link" ? "Sin enlaces todavía" : "Sin notas todavía"}
      </p>
    );
  }

  const listClass = compact ? "divide-y divide-zinc-700/50" : "content-list";

  return (
    <>
      <div className={listClass}>
        {filtered.map((item) =>
          compact ? (
            <NoteRow
              key={item.id}
              item={item}
              compact
              onShare={shareItem}
              onClick={() => handleClick(item)}
            />
          ) : (
            <SwipeToDelete key={item.id} onDelete={() => handleDelete(item)}>
              <NoteRow
                item={item}
                onShare={shareItem}
                onClick={() => handleClick(item)}
              />
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

      {sheet}
    </>
  );
}
