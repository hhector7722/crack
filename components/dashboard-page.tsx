"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Mic, ImageIcon, FileText, Link2, ExternalLink, Play } from "lucide-react";
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

function SectionWrapper({
  children,
  onClick,
  className,
  scroll = "y",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  scroll?: "y" | "x" | "none";
}) {
  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl bg-[#1c1c1e] p-5",
        onClick ? "cursor-pointer" : "",
        className
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClick) onClick();
      }}
    >
      <div
        className={cn(
          "min-h-0 flex-1",
          scroll === "y" && "overflow-y-auto",
          scroll === "x" && "overflow-x-auto no-scrollbar",
          scroll === "none" && "overflow-hidden"
        )}
      >
        {children}
      </div>
    </section>
  );
}



function ImageThumb({
  url,
  isVideo,
  onClick,
  className,
  compact = false,
}: {
  url: string | null;
  isVideo?: boolean;
  onClick?: () => void;
  className?: string;
  compact?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!isVideo || !url) return;
    const video = videoRef.current;
    if (!video) return;

    const showPosterFrame = () => {
      if (video.readyState >= 1) {
        video.currentTime = 0.1;
      }
    };

    video.addEventListener("loadeddata", showPosterFrame);
    showPosterFrame();
    return () => video.removeEventListener("loadeddata", showPosterFrame);
  }, [isVideo, url]);

  async function handlePlay(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    const video = videoRef.current;
    if (!video) return;
    try {
      video.muted = false;
      await video.play();
      setPlaying(true);
    } catch {
      // ignore autoplay restrictions
    }
  }

  const playIconClass = compact ? "h-3.5 w-3.5" : "h-5 w-5";

  const media = url ? (
    isVideo ? (
      <div className={cn("relative h-full w-full overflow-hidden rounded-lg", className)}>
        <video
          ref={videoRef}
          src={url}
          muted
          playsInline
          preload="auto"
          className="h-full w-full object-cover"
          onClick={(e) => {
            if (!playing) return;
            e.stopPropagation();
            videoRef.current?.pause();
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
        {!playing && (
          <>
            <span className="pointer-events-none absolute inset-0 bg-black/25" />
            <button
              type="button"
              onClick={handlePlay}
              className="absolute inset-0 flex items-center justify-center"
              aria-label="Reproducir vídeo"
            >
              <Play className={cn("fill-white text-white", playIconClass)} />
            </button>
          </>
        )}
      </div>
    ) : (
      <img src={url} alt="" className={cn("h-full w-full rounded-lg object-cover", className)} />
    )
  ) : (
    <div className={cn("flex h-full w-full items-center justify-center rounded-lg bg-zinc-900", className)}>
      <Loader2 className="h-4 w-4 animate-spin text-zinc-600" />
    </div>
  );

  if (!onClick) return media;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (!playing) onClick();
      }}
      onKeyDown={(e) => {
        if (!playing && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn("block h-full w-full text-left active:opacity-80", !playing && "cursor-pointer")}
    >
      {media}
    </div>
  );
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
        fetchItems(supabase, ["image", "video"], { limit: 20 }),
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
      <SectionWrapper className="h-[140px]" scroll="y" onClick={() => setSelectedCategory("audios")}>
        <div className="grid grid-cols-2 gap-4">
          {categorized.audios.map((item) => (
            <div key={item.id}>
              <CompactAudioItem item={item} onClick={() => setSelectedItem({ item, category: "audios" })} />
            </div>
          ))}
        </div>
      </SectionWrapper>
    )}

    {categorized.images.length > 0 && (
      <SectionWrapper className="h-[96px] p-3" scroll="x" onClick={() => setSelectedCategory("images")}>
        <div className="flex h-full items-center gap-2">
          {categorized.images.map((item) => (
            <div key={item.id} className="aspect-square h-full shrink-0">
              <ImageThumb
                url={item.file_url ? imageUrls[item.file_url] ?? null : null}
                isVideo={item.type === "video"}
                compact
                onClick={() => setSelectedItem({ item, category: "images" })}
              />
            </div>
          ))}
        </div>
      </SectionWrapper>
    )}

    <div className="grid grid-cols-2 gap-5">
      {categorized.notes.length > 0 ? (
        <SectionWrapper className="h-[180px]" scroll="y" onClick={() => setSelectedCategory("notes")}>
          <div className="flex flex-col gap-3">
            {categorized.notes.map((item) => (
              <div key={item.id} className="shrink-0">
                <CompactNoteItem item={item} onClick={() => setSelectedItem({ item, category: "notes" })} />
              </div>
            ))}
          </div>
        </SectionWrapper>
      ) : <div />}

      <SectionWrapper className="h-[180px]" scroll="y" onClick={() => setSelectedCategory("files")}>
        <div className="flex flex-col gap-3">
          {categorized.files && categorized.files.length > 0 ? (
            categorized.files.map((item) => (
              <div key={item.id} className="shrink-0">
                <CompactFileItem item={item} onClick={() => setSelectedItem({ item, category: "files" })} />
              </div>
            ))
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
              No hay archivos
            </div>
          )}
        </div>
      </SectionWrapper>
    </div>

    {categorized.links.length > 0 && (
      <SectionWrapper className="max-h-[180px]" scroll="y" onClick={() => setSelectedCategory("links")}>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {categorized.links.map((item) => (
            <div key={item.id}>
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
                    isVideo={item.type === "video"}
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

