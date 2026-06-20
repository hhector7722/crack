"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NoteList } from "@/components/note-list";
import { GalleryFeed } from "@/components/gallery-feed";
import { AudioFeed } from "@/components/audio-feed";
import { ProfileView } from "@/components/profile-view";
import { SwipePager } from "@/components/swipe-pager";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { ItemDetail } from "@/components/item-detail";
import { usePager } from "@/components/app-shell-context";
import { useBumpRefresh } from "@/app/(app)/layout";
import type { Item } from "@/lib/types";

/** Orden de deslizamiento (izq → der), alineado con la tab bar */
const ALL_PAGER_PATHS = [
  "/audio",
  "/media",
  "/",
  "/notes",
  "/profile",
] as const;

/** Tres indicadores centrales: galería | inicio | notas */
const PAGER_PATHS = ["/media", "/", "/notes"] as const;
const PAGER_DOT_INDICES = [1, 2, 3] as const;

const PAGE_COUNT = ALL_PAGER_PATHS.length;

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-zinc-800 p-4 shadow-sm shadow-black/40">
      {children}
    </section>
  );
}

function pathnameToIndex(pathname: string): number {
  if (pathname.startsWith("/audio")) return 0;
  if (pathname.startsWith("/media")) return 1;
  if (pathname.startsWith("/notes")) return 3;
  if (pathname.startsWith("/profile")) return 4;
  return 2;
}

interface AppPagerProps {
  refreshKey?: number;
}

export function AppPager({ refreshKey = 0 }: AppPagerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const bumpRefresh = useBumpRefresh();
  const { pagerIndex, setPagerIndex } = usePager();

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [localRefresh, setLocalRefresh] = useState(0);
  const combinedRefresh = refreshKey + localRefresh;

  useEffect(() => {
    setPagerIndex(pathnameToIndex(pathname));
  }, [pathname, setPagerIndex]);

  const handleRefresh = useCallback(async () => {
    bumpRefresh();
    router.refresh();
    await new Promise((r) => setTimeout(r, 400));
  }, [bumpRefresh, router]);

  const handleIndexChange = useCallback(
    (index: number) => {
      setPagerIndex(index);
      const target = ALL_PAGER_PATHS[index];
      if (pathname !== target) {
        router.replace(target, { scroll: false });
      }
    },
    [pathname, router, setPagerIndex]
  );

  function handleUpdated(updated: Item) {
    setSelectedItem(updated);
    setLocalRefresh((k) => k + 1);
  }

  const itemDetail = selectedItem ? (
    <ItemDetail
      key={selectedItem.id}
      item={selectedItem}
      open={!!selectedItem}
      onOpenChange={(open) => !open && setSelectedItem(null)}
      onUpdated={handleUpdated}
      onDeleted={() => {
        setSelectedItem(null);
        setLocalRefresh((k) => k + 1);
      }}
    />
  ) : null;

  return (
    <>
      <div className="h-full">
        <SwipePager index={pagerIndex} onIndexChange={handleIndexChange}>
        <PullToRefresh onRefresh={handleRefresh} className="app-pager-panel">
          <div className="pb-2">
            <AudioFeed
              refreshKey={combinedRefresh}
              onSelect={setSelectedItem}
            />
          </div>
        </PullToRefresh>

        <PullToRefresh onRefresh={handleRefresh} className="app-pager-panel">
          <GalleryFeed
            refreshKey={combinedRefresh}
            columns={5}
            onSelect={setSelectedItem}
          />
        </PullToRefresh>

        <PullToRefresh onRefresh={handleRefresh} className="app-pager-panel">
          <div className="space-y-5 pb-2">
            <SectionCard>
              <NoteList
                refreshKey={combinedRefresh}
                compact
                onSelect={setSelectedItem}
              />
            </SectionCard>

            <SectionCard>
              <GalleryFeed
                refreshKey={combinedRefresh}
                columns={4}
                limit={12}
                compact
                onSelect={setSelectedItem}
              />
            </SectionCard>

            <SectionCard>
              <AudioFeed
                refreshKey={combinedRefresh}
                compact
                onSelect={setSelectedItem}
              />
            </SectionCard>
          </div>
        </PullToRefresh>

        <PullToRefresh onRefresh={handleRefresh} className="app-pager-panel">
          <div className="pb-2">
            <NoteList
              refreshKey={combinedRefresh}
              onSelect={setSelectedItem}
            />
          </div>
        </PullToRefresh>

        <PullToRefresh onRefresh={handleRefresh} className="app-pager-panel">
          <ProfileView />
        </PullToRefresh>
      </SwipePager>
      </div>

      {itemDetail}
    </>
  );
}

export {
  PAGE_COUNT,
  PAGER_PATHS,
  PAGER_DOT_INDICES,
  ALL_PAGER_PATHS,
  pathnameToIndex,
};
