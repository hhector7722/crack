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
    <section className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
      {children}
    </section>
  );
}

function pathnameToIndex(pathname: string): number {
  if (pathname.startsWith("/notes")) return 0;
  if (pathname.startsWith("/audio")) return 2;
  if (pathname.startsWith("/media")) return 1;
  return 1;
}

interface AppPagerProps {
  refreshKey?: number;
}

export function AppPager({ refreshKey = 0 }: AppPagerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { pagerIndex, setPagerIndex } = usePager();

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [localRefresh, setLocalRefresh] = useState(0);
  const combinedRefresh = refreshKey + localRefresh;

  useEffect(() => {
    const idx = pathnameToIndex(pathname);
    setPagerIndex(idx);
  }, [pathname, setPagerIndex]);

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

  return (
    <>
      <SwipePager index={pagerIndex} onIndexChange={handleIndexChange}>
        <div className="space-y-5 pb-2">
          <SectionCard>
            <NoteList
              refreshKey={combinedRefresh}
              compact
              light
              onSelect={setSelectedItem}
            />
          </SectionCard>
        </div>

        <div className="space-y-5 pb-2">
          <SectionCard>
            <GalleryFeed
              refreshKey={combinedRefresh}
              columns={4}
              limit={12}
              compact
              onSelect={setSelectedItem}
            />
          </SectionCard>
        </div>

        <div className="space-y-5 pb-2">
          <SectionCard>
            <AudioFeed
              refreshKey={combinedRefresh}
              compact
              light
              onSelect={setSelectedItem}
            />
          </SectionCard>
        </div>
      </SwipePager>

      {selectedItem && (
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
      )}
    </>
  );
}

export { PAGE_COUNT, PAGER_PATHS, pathnameToIndex };
