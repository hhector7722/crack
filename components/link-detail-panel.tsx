"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ImagePlus, LockKeyhole, Pencil, Pin, Share2, Trash2, X } from "lucide-react";
import { LinkCover } from "@/components/link-cover";
import { createClient } from "@/lib/supabase/client";
import { deleteItem, updateItem } from "@/lib/items";
import { deleteFile, uploadFile } from "@/lib/storage";
import { decodeHtmlEntities, getNoteUrl } from "@/lib/utils";
import { parseXPostUrl } from "@/lib/link-preview";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Item } from "@/lib/types";

interface LinkDetailPanelProps {
  item: Item;
  onOpenChange: (open: boolean) => void;
  onUpdated: (item: Item) => void;
  onDeleted: () => void;
}

export function LinkDetailPanel({
  item,
  onOpenChange,
  onUpdated,
  onDeleted,
}: LinkDetailPanelProps) {
  const url = getNoteUrl(item);
  const xPost = url ? parseXPostUrl(url) : null;
  const originalTitle = item.title || item.metadata.link_title || url || "Enlace";
  const displayTitle = decodeHtmlEntities(
    xPost && /^\d{10,25}$/.test(originalTitle.trim())
      ? (item.metadata.link_title && !/^\d{10,25}$/.test(item.metadata.link_title)
        ? item.metadata.link_title : "Publicación de @" + xPost.handle)
      : originalTitle
  );
  const [title, setTitle] = useState(displayTitle);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pinning, setPinning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cacheAttempted = useRef(false);
  const onUpdatedRef = useRef(onUpdated);

  useEffect(() => {
    onUpdatedRef.current = onUpdated;
  }, [onUpdated]);

  useEffect(() => {
    if (!editing) setTitle(displayTitle);
  }, [displayTitle, editing]);

  // Intenta conservar una copia de la portada en el almacenamiento privado.
  // Si la web bloquea la descarga, se conserva la URL original y se ofrece una portada manual.
  useEffect(() => {
    if (!url || cacheAttempted.current || (item.metadata.link_image_path && !/^\d{10,25}$/.test(item.title?.trim() || ""))) return;
    cacheAttempted.current = true;
    let cancelled = false;
    void fetch("/api/link-cover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id }),
    })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((data: { item?: Item } | null) => {
        if (!cancelled && data?.item) onUpdatedRef.current(data.item);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [item.id, item.metadata.link_image_path, url]);

  async function saveTitle() {
    const value = title.trim();
    if (!value || saving) {
      if (!value) setError("El título no puede estar vacío");
      return;
    }
    if (value === item.title) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await updateItem(createClient(), item.id, { title: value });
      onUpdated(updated);
      setEditing(false);
    } catch {
      setError("No se pudo guardar el título");
    } finally {
      setSaving(false);
    }
  }

  async function togglePin() {
    if (pinning) return;
    setPinning(true);
    try {
      onUpdated(await updateItem(createClient(), item.id, { pinned: !item.pinned }));
    } catch {
      setError("No se pudo cambiar el fijado");
    } finally {
      setPinning(false);
    }
  }

  async function shareLink() {
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: displayTitle, url });
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      setError("No se pudo compartir el enlace");
    }
  }

  async function toggleExtra() {
    setError("");
    try {
      const nextExtra = item.metadata.extra !== true;
      const { error } = await createClient().rpc("set_item_extra", {
        p_item_id: item.id,
        p_extra: nextExtra,
      });
      if (error) throw error;
      onUpdated({
        ...item,
        metadata: { ...item.metadata, extra: nextExtra },
      });
    } catch {
      setError("No se pudo cambiar la categoría");
    }
  }

  async function removeLink() {
    if (!window.confirm("¿Eliminar este enlace? Esta acción no se puede deshacer.")) return;
    try {
      await deleteItem(createClient(), item.id);
      if (item.metadata.link_image_path) {
        void deleteFile(createClient(), item.metadata.link_image_path).catch(() => {});
      }
      onDeleted();
      onOpenChange(false);
    } catch {
      setError("No se pudo eliminar el enlace");
    }
  }

  async function changeCover(file: File | undefined) {
    if (!file) return;
    setError("");
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError("Selecciona una imagen JPG, PNG, WebP o GIF de hasta 5 MB");
      return;
    }
    setUploading(true);
    const client = createClient();
    let newPath: string | null = null;
    try {
      const extension = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" } as Record<string, string>)[file.type];
      newPath = await uploadFile(client, item.user_id, "images", file, extension);
      const oldPath = item.metadata.link_image_path;
      const updated = await updateItem(client, item.id, {
        metadata: { ...item.metadata, link_image_path: newPath },
      });
      onUpdated(updated);
      if (oldPath && oldPath !== newPath) {
        void deleteFile(client, oldPath).catch(() => {});
      }
    } catch {
      if (newPath) void deleteFile(client, newPath).catch(() => {});
      setError("No se pudo guardar la portada");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-1.5">
        <time
          dateTime={item.created_at}
          title={format(new Date(item.created_at), "d 'de' MMMM yyyy 'a las' H:mm", { locale: es })}
          className="shrink-0 whitespace-nowrap text-[10px] text-zinc-400"
        >
          {format(new Date(item.created_at), "dd/MM/yy")}
        </time>
        <div className="flex shrink-0 items-center gap-0.5">
          <button type="button" onClick={() => void togglePin()} disabled={pinning}
            aria-label={item.pinned ? "Desfijar" : "Fijar"} title={item.pinned ? "Desfijar" : "Fijar"}
            className="flex h-8 w-7 items-center justify-center rounded-lg text-zinc-300 active:bg-zinc-700 disabled:opacity-50">
            <Pin className={item.pinned ? "h-4 w-4 fill-current" : "h-4 w-4"} />
          </button>
          <button type="button" onClick={() => void shareLink()} aria-label="Compartir" title="Compartir"
            className="flex h-8 w-7 items-center justify-center rounded-lg text-zinc-300 active:bg-zinc-700">
            <Share2 className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => { setTitle(displayTitle); setEditing(true); setError(""); }}
            aria-label="Editar título" title="Editar título"
            className="flex h-8 w-7 items-center justify-center rounded-lg text-zinc-300 active:bg-zinc-700">
            <Pencil className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
            aria-label="Cambiar portada" title="Cambiar portada"
            className="flex h-8 w-7 items-center justify-center rounded-lg text-zinc-300 active:bg-zinc-700 disabled:opacity-50">
            <ImagePlus className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => void toggleExtra()}
            aria-label={item.metadata.extra ? "Sacar de Extra" : "Mover a Extra"}
            title={item.metadata.extra ? "Sacar de Extra" : "Mover a Extra"}
            className="flex h-8 w-7 items-center justify-center rounded-lg text-zinc-300 active:bg-zinc-700">
            <LockKeyhole className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => void removeLink()} aria-label="Eliminar" title="Eliminar"
            className="flex h-8 w-7 items-center justify-center rounded-lg text-red-300 active:bg-red-950/50">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          aria-label="Seleccionar portada"
          className="hidden"
          onChange={(event) => void changeCover(event.target.files?.[0])}
        />
      </div>

      <a
        href={url ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Abrir enlace original: ${displayTitle}`}
        className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl bg-zinc-900/60 outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
      >
        <LinkCover item={item} imageClassName="object-contain" />
      </a>

      <div className="mt-4 shrink-0 pb-1">
        {editing ? (
          <div className="flex items-start gap-2">
            <textarea
              autoFocus
              aria-label="Editar título"
              value={title}
              rows={2}
              maxLength={500}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setTitle(displayTitle);
                  setEditing(false);
                } else if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void saveTitle();
                }
              }}
              className="min-h-20 min-w-0 flex-1 resize-none rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-base font-medium text-zinc-100 outline-none focus:border-zinc-400"
            />
            <button type="button" onClick={() => void saveTitle()} disabled={saving} aria-label="Guardar título" className="flex h-10 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-100 disabled:opacity-40">
              <Check className="h-5 w-5" />
            </button>
            <button type="button" aria-label="Cancelar edición" onClick={() => { setTitle(displayTitle); setEditing(false); setError(""); }} className="flex h-10 w-8 shrink-0 items-center justify-center text-zinc-500">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            aria-label="Editar título"
            onClick={() => { setTitle(displayTitle); setEditing(true); setError(""); }}
            className="group flex w-full items-start gap-2 text-left"
          >
            <span className="min-w-0 flex-1 break-words text-lg font-semibold leading-snug text-zinc-100">{displayTitle}</span>
            <Pencil className="mt-1 h-3.5 w-3.5 shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-300" />
          </button>
        )}
        {uploading ? <p className="mt-2 text-xs text-zinc-500">Guardando portada…</p> : null}
        {error ? <p role="alert" className="mt-2 text-xs text-red-300">{error}</p> : null}
      </div>
    </div>
  );
}
