"use client";

import { useState } from "react";
import { NoteList } from "@/components/note-list";
import { GalleryFeed } from "@/components/gallery-feed";
import { AudioFeed } from "@/components/audio-feed";
import { ItemDetail } from "@/components/item-detail";
import type { Item } from "@/lib/types";

interface HomeDashboardProps {
  refreshKey?: number;
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
      {children}
    </section>
  );
}

export function HomeDashboard({ refreshKey = 0 }: HomeDashboardProps) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [localRefresh, setLocalRefresh] = useState(0);
  const combinedRefresh = refreshKey + localRefresh;

  function handleUpdated(updated: Item) {
    setSelectedItem(updated);
    setLocalRefresh((k) => k + 1);
  }

  return (
    <>
      <div className="space-y-5 pb-2">
        <SectionCard>
          <NoteList
            refreshKey={combinedRefresh}
            compact
            light
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
            light
            onSelect={setSelectedItem}
          />
        </SectionCard>
      </div>

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
