"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Mic, ImageIcon, FileText, Link2, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchItems } from "@/lib/items";
import { getSignedUrl } from "@/lib/storage";
import { usePager } from "@/components/app-shell-context";
import { resolveLinkTitle, titleFromUrl } from "@/lib/link-preview";
import { displayValue, getNoteUrl, cn } from "@/lib/utils";
import { useRealtimeSubscription } from "@/hooks/use-realtime";
import type { Item } from "@/lib/types";
import { CompactAudioItem, CompactLinkItem, CompactNoteItem, CompactFileItem } from "@/components/compact-items";
import { ItemDetail } from "@/components/item-detail";
import { AppModal } from "@/components/app-modal";

interface DashboardPageProps {
  refreshKey?: number;
}

type Categorized = {
  audios: Item[];
  images: Item[];
  notes: Item[];
  links: Item[];
  files: Item[];
};

function SectionWrapper({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <section 
      className={cn("rounded-2xl bg-[#1c1c1e] p-5", onClick ? "cursor-pointer" : "", className)}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClick) onClick();
      }}
    >
      {children}
    </section>
  );
}



function ImageThumb({ url, onClick, className }: { url: string | null; onClick?: () => void; className?: string }) {
  const inner = url ? (
    <img src={url} alt="" className={cn("object-cover rounded-lg w-full h-full", className)} />
  ) : (
    <div className={cn("flex items-center justify-center rounded-lg bg-zinc-900 w-full h-full", className)}>
      <Loader2 className="h-4 w-4 animate-spin text-zinc-600" />
    </div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn("w-full h-full text-left active:opacity-80 block", className)}>
        {inner}
      </button>
    );
  }

  return inner;
}



export function DashboardPage({ refreshKey = 0 }: DashboardPageProps) {
  const [categorized, setCategorized] = useState<Categorized | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ item: Item; category?: keyof Categorized } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<keyof Categorized | null>(null);

  const load = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    setIsRefreshing(true);
    try {
      const supabase = createClient();

      const [audios, images, notes, files] = await Promise.all([
        fetchItems(supabase, "audio", { limit: 20 }),
        fetchItems(supabase, "image", { limit: 20 }),
        fetchItems(supabase, "note", { limit: 40 }),
        fetchItems(supabase, "file", { limit: 20 }),
      ]);

      const noteItems = notes.filter((i) => !getNoteUrl(i));
      const linkItems = notes.filter((i) => getNoteUrl(i));

      setCategorized({ audios, images, notes: noteItems, links: linkItems, files });

      const imgPaths = [...new Set(images.filter((i) => i.file_url).map((i) => i.file_url!))];
      const audioPaths = [...new Set(audios.filter((i) => i.file_url).map((i) => i.file_url!))];

      const [imgEntries, audioEntries] = await Promise.all([
        Promise.all(imgPaths.map(async (p) => [p, await getSignedUrl(supabase, p).catch(() => "")] as const)),
        Promise.all(audioPaths.map(async (p) => [p, await getSignedUrl(supabase, p).catch(() => "")] as const)),
      ]);

      setImageUrls(Object.fromEntries(imgEntries.filter(([, url]) => url)));
      setAudioUrls(Object.fromEntries(audioEntries.filter(([, url]) => url)));
    } catch {
      // silent
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(categorized !== null);
  }, [load, refreshKey]);

  useRealtimeSubscription(
    "items",
    (payload) => {
      if (payload.eventType === "INSERT") {
        void load(true);
      } else if (payload.eventType === "UPDATE") {
        void load(true);
      } else if (payload.eventType === "DELETE") {
        void load(true);
      }
    }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!categorized) return null;

  const dashboardContent = (
    <div className="space-y-5">
      {isRefreshing && (
        <SectionWrapper>
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-800"></div>
          </div>
        </SectionWrapper>
      )}
      {categorized.audios.length > 0 && (
      <SectionWrapper className="h-[140px]" onClick={() => setSelectedCategory("audios")}>
        <div className="grid grid-cols-2 gap-4 pointer-events-none h-full overflow-hidden">
          {categorized.audios.slice(0, 4).map((item) => (
            <div key={item.id} className="pointer-events-auto">
              <CompactAudioItem item={item} onClick={() => setSelectedItem({ item, category: "audios" })} />
            </div>
          ))}
        </div>
      </SectionWrapper>
    )}

    {categorized.images.length > 0 && (
      <SectionWrapper className="h-[140px]" onClick={() => setSelectedCategory("images")}>
        <div className="flex overflow-x-auto gap-3 pointer-events-none no-scrollbar h-full items-center">
          {categorized.images.map((item) => (
            <div key={item.id} className="pointer-events-auto h-full shrink-0 aspect-square">
              <ImageThumb
                url={item.file_url ? imageUrls[item.file_url] ?? null : null}
                onClick={() => setSelectedItem({ item, category: "images" })}
              />
            </div>
          ))}
        </div>
      </SectionWrapper>
    )}

    <div className="grid grid-cols-2 gap-5">
      {categorized.notes.length > 0 ? (
        <SectionWrapper className="h-[180px]" onClick={() => setSelectedCategory("notes")}>
          <div className="flex flex-col gap-3 pointer-events-none overflow-hidden h-full">
            {categorized.notes.slice(0, 3).map((item) => (
              <div key={item.id} className="pointer-events-auto shrink-0">
                <CompactNoteItem item={item} onClick={() => setSelectedItem({ item, category: "notes" })} />
              </div>
            ))}
          </div>
        </SectionWrapper>
      ) : <div />}

      <SectionWrapper className="h-[180px]" onClick={() => setSelectedCategory("files")}>
        <div className="flex flex-col gap-3 pointer-events-none overflow-hidden h-full">
          {categorized.files && categorized.files.length > 0 ? (
            categorized.files.slice(0, 3).map((item) => (
              <div key={item.id} className="pointer-events-auto shrink-0">
                <CompactFileItem item={item} onClick={() => setSelectedItem({ item, category: "files" })} />
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
              No hay archivos
            </div>
          )}
        </div>
      </SectionWrapper>
    </div>

    {categorized.links.length > 0 && (
      <SectionWrapper onClick={() => setSelectedCategory("links")}>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 pointer-events-none">
          {categorized.links.slice(0, 4).map((item) => (
            <div key={item.id} className="pointer-events-auto">
              <CompactLinkItem item={item} onClick={() => setSelectedItem({ item, category: "links" })} />
            </div>
          ))}
        </div>
      </SectionWrapper>
    )}
    </div>
  );

  return (
    <div className="mx-auto w-[98%] pt-4 pb-20">
      <div className="cursor-default">
        {dashboardContent}
      </div>

      {selectedItem && (
        <ItemDetail
          key={selectedItem.item.id}
          item={selectedItem.item}
          carouselItems={selectedItem.category ? categorized[selectedItem.category] : undefined}
          open={!!selectedItem}
          onOpenChange={(open) => !open && setSelectedItem(null)}
          onUpdated={(updated) => {
            setSelectedItem({ item: updated, category: selectedItem.category });
            void load(true);
          }}
          onDeleted={() => {
            setSelectedItem(null);
            void load(true);
          }}
        />
      )}

      {selectedCategory && (
        <AppModal
          open={!!selectedCategory}
          onOpenChange={(open) => !open && setSelectedCategory(null)}
          size="fixed"
          title={
            selectedCategory === "audios" ? "Audios" :
            selectedCategory === "images" ? "Imágenes" :
            selectedCategory === "notes" ? "Notas" :
            selectedCategory === "files" ? "Archivos" : "Enlaces"
          }
        >
          <div className="flex-1 overflow-y-auto min-h-0 pb-4">
            {selectedCategory === "audios" && (
              <div className="grid grid-cols-1 gap-3">
                {categorized.audios.map(item => (
                  <CompactAudioItem key={item.id} item={item} onClick={() => setSelectedItem({ item, category: "audios" })} />
                ))}
              </div>
            )}
            {selectedCategory === "images" && (
              <div className="grid grid-cols-3 gap-2">
                {categorized.images.map(item => (
                  <ImageThumb
                    key={item.id}
                    url={item.file_url ? imageUrls[item.file_url] ?? null : null}
                    onClick={() => setSelectedItem({ item, category: "images" })}
                  />
                ))}
              </div>
            )}
            {selectedCategory === "notes" && (
              <div className="grid grid-cols-1 gap-3">
                {categorized.notes.map(item => (
                  <CompactNoteItem key={item.id} item={item} onClick={() => setSelectedItem({ item, category: "notes" })} />
                ))}
              </div>
            )}
            {selectedCategory === "links" && (
              <div className="grid grid-cols-1 gap-3">
                {categorized.links.map(item => (
                  <CompactLinkItem key={item.id} item={item} onClick={() => setSelectedItem({ item, category: "links" })} />
                ))}
              </div>
            )}
            {selectedCategory === "files" && categorized.files && (
              <div className="grid grid-cols-1 gap-3">
                {categorized.files.map(item => (
                  <CompactFileItem key={item.id} item={item} onClick={() => setSelectedItem({ item, category: "files" })} />
                ))}
              </div>
            )}
          </div>
        </AppModal>
      )}
    </div>
  );
}

