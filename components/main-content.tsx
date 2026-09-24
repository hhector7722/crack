"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fetchItems } from "@/lib/items";
import { getNoteUrl, cn } from "@/lib/utils";
import { useRealtimeSubscription } from "@/hooks/use-realtime";
import { useSearch } from "@/components/search-context";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { SearchModal } from "@/components/search-modal";
import { ItemDetail } from "@/components/item-detail";
import { CompactItemTile, ItemListRow } from "@/components/item-list-row";
import type { Item, SearchResultItem } from "@/lib/types";

type LibraryFilter = "all" | "notes" | "links" | "media" | "audio" | "files";

const FILTERS: { id: LibraryFilter; label: string }[] = [
  { id: "all", label: "Todo" },
  { id: "notes", label: "Notas" },
  { id: "links", label: "Enlaces" },
  { id: "media", label: "Fotos y vídeos" },
  { id: "audio", label: "Audios" },
  { id: "files", label: "Archivos" },
];

function sortItems(items: Item[]) {
  return [...items].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

function legacyFilter(pathname: string): LibraryFilter {
  if (pathname.startsWith("/notes")) return "notes";
  if (pathname.startsWith("/enlaces")) return "links";
  if (pathname.startsWith("/media")) return "media";
  if (pathname.startsWith("/audio")) return "audio";
  if (pathname.startsWith("/files")) return "files";
  return "all";
}

function HomeView({
  items,
  onOpen,
}: {
  items: Item[];
  onOpen: (item: Item) => void;
}) {
  const pinned = items.filter((item) => item.pinned);
  const recentlyViewed = items
    .filter((item) => !item.pinned && item.last_opened_at)
    .sort(
      (a, b) =>
        new Date(b.last_opened_at!).getTime() -
        new Date(a.last_opened_at!).getTime()
    )
    .slice(0, 8);

  const shownIds = new Set([...pinned, ...recentlyViewed].map((item) => item.id));
  const recent = items
    .filter((item) => !shownIds.has(item.id))
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const sections = [
    { title: "Fijados", items: pinned },
    { title: "Vistos recientemente", items: recentlyViewed },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-3 pb-2 pt-2">
      {sections.map((section) => (
        <section key={section.title} className="mb-4">
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            {section.title}
          </h2>
          {section.items.length ? (
            <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 pb-0.5">
              {section.items.map((item) => (
                <CompactItemTile
                  key={item.id}
                  item={item}
                  onOpen={() => onOpen(item)}
                />
              ))}
            </div>
          ) : (
            <p className="min-h-8 py-1 text-xs text-zinc-600">
              {section.title === "Fijados"
                ? "Fija elementos para tenerlos siempre a mano."
                : "Los elementos que abras aparecerán aquí."}
            </p>
          )}
        </section>
      ))}

      <section>
        <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Recientes
        </h2>
        {recent.length ? (
          <div>
            {recent.map((item) => (
              <ItemListRow
                key={item.id}
                item={item}
                compact
                onOpen={() => onOpen(item)}
              />
            ))}
          </div>
        ) : (
          <p className="py-5 text-xs text-zinc-600">
            No hay más elementos recientes.
          </p>
        )}
      </section>
    </div>
  );
}

function LibraryView({
  items,
  initialFilter,
  onOpen,
}: {
  items: Item[];
  initialFilter: LibraryFilter;
  onOpen: (item: Item) => void;
}) {
  const [filter, setFilter] = useState<LibraryFilter>(initialFilter);

  useEffect(() => setFilter(initialFilter), [initialFilter]);

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const isLink = Boolean(getNoteUrl(item));
        if (filter === "notes") return item.type === "note" && !isLink;
        if (filter === "links") return isLink;
        if (filter === "media") {
          return item.type === "image" || item.type === "video";
        }
        if (filter === "audio") return item.type === "audio";
        if (filter === "files") return item.type === "file";
        return true;
      }),
    [filter, items]
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-3 pb-3 pt-2">
      <div
        className="no-scrollbar -mx-3 mb-3 flex gap-2 overflow-x-auto px-3 pb-1"
        aria-label="Filtros de Biblioteca"
      >
        {FILTERS.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={filter === option.id}
            onClick={() => setFilter(option.id)}
            className={cn(
              "min-h-10 shrink-0 rounded-full px-4 text-sm font-medium transition-colors",
              filter === option.id
                ? "bg-zinc-100 text-zinc-950"
                : "bg-zinc-900 text-zinc-400 active:bg-zinc-800"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filtered.length ? (
        <div>
          {filtered.map((item) => (
            <ItemListRow
              key={item.id}
              item={item}
              onOpen={() => onOpen(item)}
            />
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-sm text-zinc-600">
          No hay elementos en este filtro.
        </p>
      )}
    </div>
  );
}

export function MainContent({ refreshKey = 0 }: { refreshKey?: number }) {
  const pathname = usePathname();
  const { searchOpen, setSearchOpen } = useSearch();
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchItems(createClient());
      setItems(sortItems(data));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar los elementos"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems, refreshKey]);

  useRealtimeSubscription("items", (payload) => {
    if (payload.eventType === "DELETE") {
      const deleted = payload.old as unknown as Item;
      setItems((current) =>
        current.filter((item) => item.id !== deleted.id)
      );
      return;
    }

    const changed = payload.new as unknown as Item;
    setItems((current) =>
      sortItems([changed, ...current.filter((item) => item.id !== changed.id)])
    );
  });

  function updateItemInState(updated: Item) {
    setItems((current) =>
      sortItems([updated, ...current.filter((item) => item.id !== updated.id)])
    );
    setSelectedItem(updated);
  }

  const isLibrary =
    pathname === "/biblioteca" ||
    ["/notes", "/enlaces", "/media", "/audio", "/files"].some((path) =>
      pathname.startsWith(path)
    );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <>
      <PullToRefresh
        action="refresh"
        onPullRelease={loadItems}
        className="h-full"
      >
        {error ? (
          <div className="flex flex-col items-center px-4 py-16 text-center">
            <p className="text-sm text-red-300">{error}</p>
            <button
              type="button"
              onClick={() => void loadItems()}
              className="mt-4 flex min-h-12 items-center gap-2 px-4 text-sm text-zinc-300"
            >
              <RefreshCw className="h-4 w-4" /> Reintentar
            </button>
          </div>
        ) : isLibrary ? (
          <LibraryView
            items={items}
            initialFilter={legacyFilter(pathname)}
            onOpen={setSelectedItem}
          />
        ) : (
          <HomeView items={items} onOpen={setSelectedItem} />
        )}
      </PullToRefresh>

      {selectedItem ? (
        <ItemDetail
          key={selectedItem.id}
          item={selectedItem}
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setSelectedItem(null);
          }}
          onUpdated={updateItemInState}
          onOpened={(id, openedAt) => {
            setItems((current) =>
              current.map((item) =>
                item.id === id
                  ? { ...item, last_opened_at: openedAt }
                  : item
              )
            );
          }}
          onDeleted={() => {
            setItems((current) =>
              current.filter((item) => item.id !== selectedItem.id)
            );
            setSelectedItem(null);
          }}
        />
      ) : null}

      <SearchModal
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelect={(item: SearchResultItem) => setSelectedItem(item)}
        onRefresh={loadItems}
      />
    </>
  );
}
