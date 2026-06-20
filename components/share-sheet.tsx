"use client";

import { AppModal } from "@/components/app-modal";
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
    <AppModal open={open} onOpenChange={onOpenChange} title="Compartir">
      <button
        type="button"
        onClick={() => void handleShare()}
        className="action-ghost min-h-12"
      >
        Compartir
      </button>
    </AppModal>
  );
}
