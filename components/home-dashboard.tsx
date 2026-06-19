"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Mic,
  FileText,
  Images,
  Bell,
  AlertTriangle,
  Info,
  Pin,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchItems } from "@/lib/items";
import { ItemDetail } from "@/components/item-detail";
import {
  displayValue,
  formatRelative,
  cn,
} from "@/lib/utils";
import type { Item } from "@/lib/types";

interface HomeDashboardProps {
  refreshKey?: number;
}

interface DashboardStats {
  total: number;
  note: number;
  image: number;
  audio: number;
  reminder: number;
  important: number;
  info: number;
  pinned: number;
}

function computeStats(items: Item[]): DashboardStats {
  const stats: DashboardStats = {
    total: items.length,
    note: 0,
    image: 0,
    audio: 0,
    reminder: 0,
    important: 0,
    info: 0,
    pinned: 0,
  };

  for (const item of items) {
    if (item.type === "note") stats.note++;
    if (item.type === "image") stats.image++;
    if (item.type === "audio") stats.audio++;
    if (item.pinned) stats.pinned++;

    const cls = item.metadata.classification_type;
    if (cls === "reminder") stats.reminder++;
    if (cls === "important") stats.important++;
    if (cls === "info") stats.info++;
  }

  return stats;
}

function FormatWidget({
  href,
  label,
  count,
  icon: Icon,
  accent,
}: {
  href: string;
  label: string;
  count: number;
  icon: typeof FileText;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[108px] flex-col justify-between rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition-transform active:scale-[0.98]"
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            accent
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <ChevronRight className="h-4 w-4 text-zinc-300" />
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums text-zinc-900">
          {count > 0 ? count : " "}
        </p>
        <p className="text-sm font-medium text-zinc-500">{label}</p>
      </div>
    </Link>
  );
}

function ClassWidget({
  href,
  label,
  count,
  icon: Icon,
  accent,
}: {
  href: string;
  label: string;
  count: number;
  icon: typeof Bell;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[72px] items-center gap-3 rounded-xl border border-zinc-100 bg-white px-4 py-3 shadow-sm transition-transform active:scale-[0.98]"
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          accent
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-800">{label}</p>
        <p className="text-xs text-zinc-400">
          {count > 0 ? `${count} elemento${count === 1 ? "" : "s"}` : " "}
        </p>
      </div>
      <span className="shrink-0 text-lg font-bold tabular-nums text-zinc-900">
        {count > 0 ? count : " "}
      </span>
    </Link>
  );
}

function DashboardItemRow({
  item,
  onClick,
}: {
  item: Item;
  onClick: () => void;
}) {
  const summary =
    item.metadata.summary ?? item.content?.slice(0, 80) ?? " ";

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-zinc-100 py-3 text-left last:border-b-0 active:opacity-70"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {item.pinned && (
            <Pin className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />
          )}
          <p className="truncate text-sm font-semibold text-zinc-900">
            {displayValue(item.title) === " " ? "Sin título" : item.title}
          </p>
        </div>
        <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">{summary}</p>
      </div>
      <span className="shrink-0 text-[10px] text-zinc-400">
        {formatRelative(item.created_at)}
      </span>
    </button>
  );
}

export function HomeDashboard({ refreshKey = 0 }: HomeDashboardProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const data = await fetchItems(supabase);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems, refreshKey]);

  const stats = useMemo(() => computeStats(items), [items]);
  const recent = useMemo(() => items.slice(0, 5), [items]);
  const pinned = useMemo(() => items.filter((i) => i.pinned).slice(0, 3), [items]);

  function handleUpdated(updated: Item) {
    setItems((prev) =>
      prev
        .map((i) => (i.id === updated.id ? updated : i))
        .sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        })
    );
    setSelectedItem(updated);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-red-300">{error}</p>
        <button
          type="button"
          onClick={() => void loadItems()}
          className="mt-3 text-sm text-zinc-400 underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5 pb-2">
        <section className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Resumen
          </p>
          <p className="mt-1 text-3xl font-bold text-zinc-900">
            {stats.total > 0 ? stats.total : " "}
          </p>
          <p className="text-sm text-zinc-500">
            {stats.total === 1
              ? "elemento guardado"
              : stats.total > 1
                ? "elementos guardados"
                : "Sin contenido todavía"}
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-300">Formatos</h2>
          <div className="grid grid-cols-2 gap-3">
            <FormatWidget
              href="/notes"
              label="Notas"
              count={stats.note}
              icon={FileText}
              accent="bg-sky-50 text-sky-600"
            />
            <FormatWidget
              href="/media"
              label="Galería"
              count={stats.image}
              icon={Images}
              accent="bg-violet-50 text-violet-600"
            />
            <FormatWidget
              href="/audio"
              label="Audios"
              count={stats.audio}
              icon={Mic}
              accent="bg-rose-50 text-rose-600"
            />
            <Link
              href="/notes"
              className="flex min-h-[108px] flex-col justify-between rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition-transform active:scale-[0.98]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Pin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums text-zinc-900">
                  {stats.pinned > 0 ? stats.pinned : " "}
                </p>
                <p className="text-sm font-medium text-zinc-500">Fijados</p>
              </div>
            </Link>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-300">
            Clasificación IA
          </h2>
          <div className="space-y-2">
            <ClassWidget
              href="/audio"
              label="Recordatorios"
              count={stats.reminder}
              icon={Bell}
              accent="bg-amber-50 text-amber-600"
            />
            <ClassWidget
              href="/audio"
              label="Importantes"
              count={stats.important}
              icon={AlertTriangle}
              accent="bg-red-50 text-red-600"
            />
            <ClassWidget
              href="/audio"
              label="Informativos"
              count={stats.info}
              icon={Info}
              accent="bg-blue-50 text-blue-600"
            />
          </div>
        </section>

        {pinned.length > 0 && (
          <section className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-800">Fijados</h2>
              <Pin className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              {pinned.map((item) => (
                <DashboardItemRow
                  key={item.id}
                  item={item}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-800">Recientes</h2>
            {recent.length > 0 && (
              <span className="text-xs text-zinc-400">últimos 5</span>
            )}
          </div>
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-400">
              Usa el botón + para capturar tu primer contenido
            </p>
          ) : (
            <div>
              {recent.map((item) => (
                <DashboardItemRow
                  key={item.id}
                  item={item}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {selectedItem && (
        <ItemDetail
          key={selectedItem.id}
          item={selectedItem}
          open={!!selectedItem}
          onOpenChange={(open) => !open && setSelectedItem(null)}
          onUpdated={handleUpdated}
          onDeleted={() => {
            setItems((prev) => prev.filter((i) => i.id !== selectedItem.id));
            setSelectedItem(null);
          }}
        />
      )}
    </>
  );
}
