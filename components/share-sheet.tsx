"use client";

import { Share2 } from "lucide-react";
import { BottomSheet } from "@/components/bottom-sheet";
import { sharePayload, type SharePayload } from "@/lib/share";

interface ShareSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: SharePayload | null;
}

export function ShareSheet({ open, onOpenChange, payload }: ShareSheetProps) {
  async function handleShare() {
    if (!payload) return;
    await sharePayload(payload);
    onOpenChange(false);
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Compartir">
      <button
        type="button"
        onClick={() => void handleShare()}
        className="action-ghost min-h-14"
      >
        <Share2 className="h-5 w-5" />
        Compartir
      </button>
    </BottomSheet>
  );
}
