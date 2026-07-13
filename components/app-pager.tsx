"use client";

import { useCallback, useState } from "react";
import { DashboardPage } from "@/components/dashboard-page";
import { NoteList } from "@/components/note-list";
import { GalleryFeed } from "@/components/gallery-feed";
import { AudioFeed } from "@/components/audio-feed";
import { FileFeed } from "@/components/file-feed";
import { SwipePager } from "@/components/swipe-pager";
import { PagerPanel } from "@/components/pager-panel";
import { ItemDetail } from "@/components/item-detail";
import { SearchModal } from "@/components/search-modal";
import { useSearch } from "@/components/search-context";
import { usePager } from "@/components/app-shell-context";
import { useBumpRefresh } from "@/app/(app)/layout";
import type { Item, SearchResultItem } from "@/lib/types";

interface AppPagerProps {
  refreshKey?: number;
}

export function AppPager({ refreshKey = 0 }: AppPagerProps) {
  const bumpRefresh = useBumpRefresh();
  const { pagerIndex, navigateToPage } = usePager();
  const { searchOpen, setSearchOpen } = useSearch();

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [localRefresh, setLocalRefresh] = useState(0);
  const combinedRefresh = refreshKey + localRefresh;

  function handleSearchSelect(item: SearchResultItem) {
    setSelectedItem(item);
  }

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
      <div className="tm-app-pager flex min-h-0 flex-1 flex-col">
        <SwipePager
          className="h-full min-h-0 w-full flex-1"
          index={pagerIndex}
          onIndexChange={handleIndexChange}
        >
          <PagerPanel onRefresh={handleRefresh}>
            <div className="pb-2">
              <FileFeed
                refreshKey={combinedRefresh}
                onSelect={setSelectedItem}
              />
            </div>
          </PagerPanel>

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
            <DashboardPage refreshKey={combinedRefresh} />
          </PagerPanel>

          <PagerPanel onRefresh={handleRefresh}>
            <div className="pb-2">
              <NoteList
                refreshKey={combinedRefresh}
                filterType="link"
                onSelect={setSelectedItem}
              />
            </div>
          </PagerPanel>

          <PagerPanel onRefresh={handleRefresh}>
            <div className="pb-2">
              <NoteList
                refreshKey={combinedRefresh}
                filterType="note"
                onSelect={setSelectedItem}
              />
            </div>
          </PagerPanel>
        </SwipePager>
      </div>

      {itemDetail}

      <SearchModal
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelect={handleSearchSelect}
      />
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
