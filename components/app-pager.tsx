"use client";

import { useCallback, useState } from "react";
import { NoteList } from "@/components/note-list";
import { GalleryFeed } from "@/components/gallery-feed";
import { AudioFeed } from "@/components/audio-feed";
import { ProfileView } from "@/components/profile-view";
import { ResizableEmptyCard } from "@/components/resizable-empty-card";
import { SwipePager } from "@/components/swipe-pager";
import { PagerPanel } from "@/components/pager-panel";
import { ItemDetail } from "@/components/item-detail";
import { usePager } from "@/components/app-shell-context";
import { useBumpRefresh } from "@/app/(app)/layout";
import type { Item } from "@/lib/types";

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-zinc-800 p-4 shadow-sm shadow-black/40">
      {children}
    </section>
  );
}

interface AppPagerProps {
  refreshKey?: number;
}

export function AppPager({ refreshKey = 0 }: AppPagerProps) {
  const bumpRefresh = useBumpRefresh();
  const { pagerIndex, navigateToPage } = usePager();

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [localRefresh, setLocalRefresh] = useState(0);
  const combinedRefresh = refreshKey + localRefresh;

  const handleRefresh = useCallback(async () => {
    bumpRefresh();
    await new Promise((r) => setTimeout(r, 400));
  }, [bumpRefresh]);

  const handleIndexChange = useCallback(
    (index: number) => {
      navigateToPage(index);
    },
    [navigateToPage]
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
          <PagerPanel onRefresh={handleRefresh}>
            <div className="pb-2">
              <AudioFeed
                refreshKey={combinedRefresh}
                onSelect={setSelectedItem}
              />
            </div>
          </PagerPanel>

          <PagerPanel onRefresh={handleRefresh}>
            <GalleryFeed
              refreshKey={combinedRefresh}
              columns={5}
              onSelect={setSelectedItem}
            />
          </PagerPanel>

          <PagerPanel onRefresh={handleRefresh}>
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

              <ResizableEmptyCard />
            </div>
          </PagerPanel>

          <PagerPanel onRefresh={handleRefresh}>
            <div className="pb-2">
              <NoteList
                refreshKey={combinedRefresh}
                onSelect={setSelectedItem}
              />
            </div>
          </PagerPanel>

          <PagerPanel onRefresh={handleRefresh}>
            <ProfileView />
          </PagerPanel>
        </SwipePager>
      </div>

      {itemDetail}
    </>
  );
}

export {
  ALL_PAGER_PATHS,
  PAGE_COUNT,
  PAGER_DOT_INDICES,
  PAGER_PATHS,
  pathnameToIndex,
  pagerIndexToDotIndex,
} from "@/lib/pager-routes";
