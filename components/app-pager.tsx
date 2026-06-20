"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NoteList } from "@/components/note-list";
import { GalleryFeed } from "@/components/gallery-feed";
import { AudioFeed } from "@/components/audio-feed";
import { SwipePager } from "@/components/swipe-pager";
import { ItemDetail } from "@/components/item-detail";
import { usePager } from "@/components/app-shell-context";
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
  const { pagerIndex, setPagerIndex } = usePager();
  const isGalleryPage = pathname.startsWith("/media");

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [localRefresh, setLocalRefresh] = useState(0);
  const combinedRefresh = refreshKey + localRefresh;

  useEffect(() => {
    if (isGalleryPage) return;
    setPagerIndex(pathnameToIndex(pathname));
  }, [pathname, isGalleryPage, setPagerIndex]);

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

  if (isGalleryPage) {
    return (
      <>
        <div className="app-pager-panel h-full overflow-y-auto">
          <GalleryFeed
            refreshKey={combinedRefresh}
            columns={5}
            onSelect={setSelectedItem}
          />
        </div>
        {itemDetail}
      </>
    );
  }

  return (
    <>
      <SwipePager index={pagerIndex} onIndexChange={handleIndexChange}>
        <div className="pb-2">
          <NoteList
            refreshKey={combinedRefresh}
            onSelect={setSelectedItem}
          />
        </div>

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

        <div className="pb-2">
          <AudioFeed
            refreshKey={combinedRefresh}
            onSelect={setSelectedItem}
          />
        </div>
      </SwipePager>

      {itemDetail}
    </>
  );
}

export { PAGE_COUNT, PAGER_PATHS, pathnameToIndex };
