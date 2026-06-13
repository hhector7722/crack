"use client";

import { Pin, Mic, FileText, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  classificationColor,
  classificationLabel,
  displayValue,
  formatRelative,
  cn,
} from "@/lib/utils";
import type { Item } from "@/lib/types";

interface ItemCardProps {
  item: Item;
  onClick: () => void;
}

function TypeIcon({ type }: { type: Item["type"] }) {
  switch (type) {
    case "audio":
      return <Mic className="h-4 w-4 text-zinc-500" />;
    case "image":
      return <ImageIcon className="h-4 w-4 text-zinc-500" />;
    default:
      return <FileText className="h-4 w-4 text-zinc-500" />;
  }
}

export function ItemCard({ item, onClick }: ItemCardProps) {
  const classificationType = item.metadata.classification_type;
  const summary =
    item.metadata.summary ?? item.content?.slice(0, 120) ?? " ";

  return (
    <button type="button" onClick={onClick} className="content-row">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <TypeIcon type={item.type} />
          <h3 className="truncate font-semibold text-zinc-100">
            {displayValue(item.title) === " "
              ? "Sin título"
              : item.title}
          </h3>
        </div>
        {item.pinned && (
          <Pin className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
        )}
      </div>

      <p className="mb-3 line-clamp-2 text-sm text-zinc-400">{summary}</p>

      <div className="flex items-center justify-between gap-2">
        {classificationType ? (
          <Badge className={cn(classificationColor(classificationType))}>
            {classificationLabel(classificationType)}
          </Badge>
        ) : (
          <span> </span>
        )}
        <span className="shrink-0 text-xs text-zinc-600">
          {formatRelative(item.created_at)}
        </span>
      </div>
    </button>
  );
}
