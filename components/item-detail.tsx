"use client";

import { useEffect, useState } from "react";
import { Drawer } from "vaul";
import { Pin, PinOff, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { updateItem, deleteItem, togglePin } from "@/lib/items";
import { getSignedUrl, deleteFile } from "@/lib/storage";
import {
  classificationColor,
  classificationLabel,
  displayValue,
  formatRelative,
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

  async function handleTogglePin() {
    try {
      const supabase = createClient();
      await togglePin(supabase, item.id, !item.pinned);
      onUpdated({ ...item, pinned: !item.pinned });
    } catch {
      alert("Error actualizando pin");
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

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[70] bg-black/60" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-[70] mx-auto flex max-h-[92dvh] max-w-[430px] flex-col rounded-t-2xl border border-zinc-800 bg-zinc-950 outline-none">
          <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-zinc-700" />
          <div className="flex-1 overflow-y-auto px-5 pb-8 pt-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs text-zinc-500">
                {formatRelative(item.created_at)}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleTogglePin}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800"
                >
                  {item.pinned ? (
                    <PinOff className="h-5 w-5" />
                  ) : (
                    <Pin className="h-5 w-5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {classificationType && (
              <Badge
                className={cn("mb-3", classificationColor(classificationType))}
              >
                {classificationLabel(classificationType)}
              </Badge>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-zinc-400">Título</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-zinc-100 focus:border-zinc-600 focus:outline-none"
                />
              </div>

              {item.type === "audio" && (
                <>
                  {loadingMedia ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                    </div>
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
                      <label className="mb-1 block text-sm text-zinc-400">
                        Tipo IA
                      </label>
                      <select
                        value={classificationType ?? "note"}
                        onChange={(e) =>
                          setClassificationType(
                            e.target.value as ClassificationType
                          )
                        }
                        className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-zinc-100"
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
                        onChange={(e) =>
                          setPriority(e.target.value as Priority)
                        }
                        className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-zinc-100"
                      >
                        <option value="high">Alta</option>
                        <option value="medium">Media</option>
                        <option value="low">Baja</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-zinc-400">
                      Tags
                    </label>
                    <input
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-zinc-100 focus:border-zinc-600 focus:outline-none"
                    />
                  </div>

                  {item.metadata.duration_seconds ? (
                    <p className="text-sm text-zinc-500">
                      Duración: {displayValue(item.metadata.duration_seconds)}s
                    </p>
                  ) : null}
                </>
              )}

              {item.type === "note" && (
                <div>
                  <label className="mb-1 block text-sm text-zinc-400">
                    Contenido
                  </label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                  />
                </div>
              )}

              {item.type === "image" && (
                <>
                  {loadingMedia ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                    </div>
                  ) : mediaUrl ? (
                    <div className="overflow-hidden rounded-xl border border-zinc-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={mediaUrl}
                        alt={title}
                        className="w-full object-contain"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-red-400">
                      No se pudo cargar la imagen
                    </p>
                  )}
                </>
              )}

              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
