"use client";

import { useEffect, useState } from "react";
import { Play, Link2, Pencil, Trash2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AppModal } from "@/components/app-modal";
import { createClient } from "@/lib/supabase/client";
import { updateItem, deleteItem } from "@/lib/items";
import { getSignedUrl, deleteFile } from "@/lib/storage";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  classificationColor,
  classificationLabel,
  displayValue,
  formatRelative,
  getNoteUrl,
  cn,
} from "@/lib/utils";
import type { Item, ClassificationType, Priority } from "@/lib/types";

interface ItemDetailProps {
  item: Item;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (item: Item) => void;
  onDeleted: () => void;
}

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      return u.hostname.includes("youtu.be") ? u.pathname.slice(1) : u.searchParams.get("v");
    }
  } catch {}
  return null;
}

export function ItemDetail({
  item,
  open,
  onOpenChange,
  onUpdated,
  onDeleted,
}: ItemDetailProps) {
  const [title, setTitle] = useState(item.title ?? "");
  const [content, setContent] = useState(item.content ?? "");
  const [tags, setTags] = useState(item.metadata.tags?.join(", ") ?? "");
  const [classificationType, setClassificationType] = useState<
    ClassificationType | undefined
  >(item.metadata.classification_type);
  const [priority, setPriority] = useState<Priority | undefined>(
    item.metadata.priority
  );
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [linkImage, setLinkImage] = useState<string | null>(item.metadata.link_image ?? null);
  const [linkDescription, setLinkDescription] = useState<string | null>(item.metadata.link_description ?? null);

  const url = getNoteUrl(item);

  useEffect(() => {
    if (!open || !url || (item.metadata.link_image && item.metadata.link_description)) return;
    const url_ = url;
    let cancelled = false;
    async function loadLinkPreview() {
      try {
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url_)}`);
        const data = (await res.json()) as {
          title?: string | null;
          image?: string | null;
          description?: string | null;
        };
        if (!cancelled) {
          if (!item.metadata.link_image && data.image) setLinkImage(data.image);
          if (!item.metadata.link_description && data.description) setLinkDescription(data.description);
        }
      } catch {}
    }
    void loadLinkPreview();
    return () => { cancelled = true; };
  }, [open, url, item.metadata.link_image, item.metadata.link_description]);

  useEffect(() => {
    if (!open || !item.file_url) return;

    let cancelled = false;

    async function loadMedia() {
      setLoadingMedia(true);
      try {
        const supabase = createClient();
        const url = await getSignedUrl(supabase, item.file_url!);
        if (!cancelled) setMediaUrl(url);
      } catch {
        if (!cancelled) setMediaUrl(null);
      } finally {
        if (!cancelled) setLoadingMedia(false);
      }
    }

    void loadMedia();
    return () => {
      cancelled = true;
    };
  }, [open, item.file_url]);

  async function handleSave() {
    setSaving(true);
    try {
      const supabase = createClient();
      const updated = await updateItem(supabase, item.id, {
        title,
        content,
        metadata: {
          ...item.metadata,
          tags: tags
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean),
          classification_type: classificationType,
          priority,
        },
      });
      onUpdated(updated);
    } catch {
      alert("Error guardando cambios");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("¿Eliminar permanentemente?")) return;
    try {
      const supabase = createClient();
      if (item.file_url) {
        await deleteFile(supabase, item.file_url);
      }
      await deleteItem(supabase, item.id);
      onDeleted();
      onOpenChange(false);
    } catch {
      alert("Error eliminando item");
    }
  }

  function handleShare() {
    const shareData: ShareData = {
      title: item.title ?? "Crack",
      text: item.metadata.summary ?? item.content ?? undefined,
      url: url ?? undefined,
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else if (navigator.clipboard) {
      const text = url ?? item.content ?? item.title ?? "";
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange} size="fixed">
      <div className="mb-4 flex flex-col items-end gap-2">
        <span className="text-xs text-zinc-400 whitespace-nowrap">
          {format(new Date(item.created_at), "d 'de' MMMM yyyy 'a las' H:mm", { locale: es })}
        </span>
        <div className="flex items-center gap-2">
          {mode === "edit" && (
            <button
              type="button"
              onClick={handleDelete}
              className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={handleShare}
            className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setMode(m => m === "view" ? "edit" : "view")}
            className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      </div>

      {classificationType ? (
        <div className="mb-4">
          <Badge className={cn("w-fit", classificationColor(classificationType))}>
            {classificationLabel(classificationType)}
          </Badge>
        </div>
      ) : null}

      {mode === "view" ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col gap-2"
            >
              {(() => {
                const videoId = getYouTubeId(url);
                const thumbUrl = videoId
                  ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                  : linkImage || null;
                return (
                  <>
                    {thumbUrl ? (
                      <div className="relative overflow-hidden rounded-xl">
                        <img
                          src={thumbUrl}
                          alt={item.title || ""}
                          className="w-full object-contain max-h-[200px]"
                        />
                        {videoId && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm transition-transform hover:scale-110">
                              <Play className="ml-0.5 h-6 w-6 fill-white text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex aspect-video items-center justify-center rounded-xl bg-zinc-900">
                        <Link2 className="h-10 w-10 text-zinc-600" />
                      </div>
                    )}
                    {item.title && (
                      <p className="text-sm font-semibold text-zinc-100">
                        {item.title}
                      </p>
                    )}
                    {linkDescription && (
                      <p className="whitespace-pre-wrap text-sm text-zinc-400">
                        {linkDescription}
                      </p>
                    )}
                  </>
                );
              })()}
            </a>
          ) : item.type === "image" ? (
            <div className="flex min-h-0 flex-1 items-center justify-center">
              {loadingMedia ? (
                <p className="text-sm text-zinc-500">Cargando imagen...</p>
              ) : mediaUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={mediaUrl}
                  alt={item.title || "Imagen"}
                  className="max-h-full max-w-full rounded-xl object-contain"
                />
              ) : (
                <p className="text-sm text-red-400">No se pudo cargar la imagen</p>
              )}
            </div>
          ) : item.type === "audio" ? (
            <div className="flex flex-col gap-3 shrink-0">
              {loadingMedia ? (
                <p className="text-sm text-zinc-500">Cargando audio...</p>
              ) : mediaUrl ? (
                <audio controls src={mediaUrl} className="w-full" />
              ) : null}
              {item.content ? (
                <div className="prose prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-zinc-300">{item.content}</p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <p
                className="whitespace-pre-wrap text-zinc-300 cursor-text"
                onClick={() => {
                  setContent(item.content ?? "");
                  setTitle(item.title ?? "");
                  setMode("edit");
                }}
              >
                {item.content || "Sin contenido"}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-float"
            />
          </div>

          {item.type === "audio" ? (
            <>
              {loadingMedia ? (
                <p className="py-2 text-sm text-zinc-500">Cargando audio...</p>
              ) : mediaUrl ? (
                <audio controls src={mediaUrl} className="w-full" />
              ) : null}

              <div>
                <label className="mb-1 block text-sm text-zinc-400">
                  Transcripción
                </label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-zinc-400">Tipo IA</label>
                  <select
                    value={classificationType ?? "note"}
                    onChange={(e) =>
                      setClassificationType(e.target.value as ClassificationType)
                    }
                    className="select-float"
                  >
                    <option value="note">Nota</option>
                    <option value="reminder">Recordatorio</option>
                    <option value="important">Importante</option>
                    <option value="info">Info</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-zinc-400">
                    Prioridad
                  </label>
                  <select
                    value={priority ?? "medium"}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="select-float"
                  >
                    <option value="high">Alta</option>
                    <option value="medium">Media</option>
                    <option value="low">Baja</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-zinc-400">Tags</label>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="input-float"
                />
              </div>

              {item.metadata.duration_seconds ? (
                <p className="text-sm text-zinc-500">
                  Duración: {displayValue(item.metadata.duration_seconds)}s
                </p>
              ) : null}
            </>
          ) : null}

          {item.type === "note" ? (
            <div>
              <label className="mb-1 block text-sm text-zinc-400">Contenido</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
              />
            </div>
          ) : null}

          {item.type === "image" ? (
            <>
              {loadingMedia ? (
                <p className="py-4 text-sm text-zinc-500">Cargando imagen...</p>
              ) : mediaUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={mediaUrl}
                  alt={title}
                  className="max-h-[min(50dvh,calc(var(--tm-vv-height,100dvh)*0.5))] w-full object-contain"
                />
              ) : (
                <p className="text-sm text-red-400">No se pudo cargar la imagen</p>
              )}
            </>
          ) : null}

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      )}
    </AppModal>
  );
}
