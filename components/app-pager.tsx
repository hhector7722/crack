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

const PAGER_PATHS = ["/notes", "/", "/audio"] as const;
const PAGE_COUNT = 3;

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-zinc-800 p-4 shadow-sm shadow-black/40">
      {children}
    </section>
  );
}

function pathnameToIndex(pathname: string): number {
  if (pathname.startsWith("/notes")) return 0;
  if (pathname.startsWith("/audio")) return 2;
  return 1;
}

interface AppPagerProps {
  refreshKey?: number;
}

export function AppPager({ refreshKey = 0 }: AppPagerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const bumpRefresh = useBumpRefresh();
  const { pagerIndex, setPagerIndex } = usePager();
  const isGalleryPage = pathname.startsWith("/media");
  const isProfilePage = pathname.startsWith("/profile");

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [localRefresh, setLocalRefresh] = useState(0);
  const combinedRefresh = refreshKey + localRefresh;

  useEffect(() => {
    if (isGalleryPage || isProfilePage) return;
    setPagerIndex(pathnameToIndex(pathname));
  }, [pathname, isGalleryPage, isProfilePage, setPagerIndex]);

  const handleRefresh = useCallback(async () => {
    bumpRefresh();
    router.refresh();
    await new Promise((r) => setTimeout(r, 400));
  }, [bumpRefresh, router]);

  const handleIndexChange = useCallback(
    (index: number) => {
      setPagerIndex(index);
      const target = PAGER_PATHS[index];
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

  if (isProfilePage) {
    return (
      <>
        <PullToRefresh onRefresh={handleRefresh} className="app-pager-panel">
          <ProfileView />
        </PullToRefresh>
        {itemDetail}
      </>
    );
  }

  if (isGalleryPage) {
    return (
      <>
        <PullToRefresh onRefresh={handleRefresh} className="app-pager-panel">
          <GalleryFeed
            refreshKey={combinedRefresh}
            columns={5}
            onSelect={setSelectedItem}
          />
        </PullToRefresh>
        {itemDetail}
      </>
    );
  }

  return (
    <>
      <SwipePager index={pagerIndex} onIndexChange={handleIndexChange}>
        <PullToRefresh onRefresh={handleRefresh} className="app-pager-panel">
          <div className="pb-2">
            <NoteList
              refreshKey={combinedRefresh}
              onSelect={setSelectedItem}
            />
          </div>
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
            <AudioFeed
              refreshKey={combinedRefresh}
              onSelect={setSelectedItem}
            />
          </div>
        </PullToRefresh>
      </SwipePager>

      {itemDetail}
    </>
  );
}

export { PAGE_COUNT, PAGER_PATHS, pathnameToIndex };
