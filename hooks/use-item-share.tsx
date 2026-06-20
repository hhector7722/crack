"use client";

import { useState } from "react";
import { ShareSheet } from "@/components/share-sheet";
import { buildSharePayload, type SharePayload } from "@/lib/share";
import type { Item } from "@/lib/types";

export function useItemShare() {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<SharePayload | null>(null);

  function shareItem(item: Item, mediaUrl?: string | null) {
    setPayload(buildSharePayload(item, mediaUrl));
    setOpen(true);
  }

  const sheet = (
    <ShareSheet open={open} onOpenChange={setOpen} payload={payload} />
  );

  return { shareItem, sheet };
}
