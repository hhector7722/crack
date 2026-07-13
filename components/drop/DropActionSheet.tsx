"use client";

import { useState } from "react";
import {
  Archive,
  Copy,
  Loader2,
  Share2,
  Trash2,
  Download,
} from "lucide-react";
import { AppModal } from "@/components/app-modal";
import type { Drop } from "@/lib/drop/types";

export type DropActionId =
  | "copy"
  | "share"
  | "save"
  | "crack"
  | "delete";

interface DropActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drop: Drop | null;
  onAction: (action: DropActionId, drop: Drop) => Promise<void>;
}

export function DropActionSheet({
  open,
  onOpenChange,
  drop,
  onAction,
}: DropActionSheetProps) {
  const [busy, setBusy] = useState<DropActionId | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: DropActionId) {
    if (!drop || busy) return;
    setBusy(action);
    setError(null);
    try {
      await onAction(action, drop);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error en la acción");
    } finally {
      setBusy(null);
    }
  }

  const hasAttachments = (drop?.attachments.length ?? 0) > 0;

  const actions: Array<{
    id: DropActionId;
    label: string;
    icon: typeof Copy;
    destructive?: boolean;
    hidden?: boolean;
  }> = [
    { id: "copy", label: "Copiar", icon: Copy },
    { id: "share", label: "Compartir", icon: Share2 },
    {
      id: "save",
      label: "Guardar en dispositivo",
      icon: Download,
      hidden: !hasAttachments,
    },
    { id: "crack", label: "Enviar a Crack", icon: Archive },
    { id: "delete", label: "Eliminar", icon: Trash2, destructive: true },
  ];

  return (
    <AppModal
      open={open}
      onOpenChange={(next) => {
        if (!next) setError(null);
        onOpenChange(next);
      }}
      title="Mensaje"
    >
      {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}
      <div className="flex flex-col">
        {actions
          .filter((action) => !action.hidden)
          .map((action) => {
            const Icon = action.icon;
            const loading = busy === action.id;
            return (
              <button
                key={action.id}
                type="button"
                disabled={Boolean(busy)}
                onClick={() => void run(action.id)}
                className={`action-ghost min-h-12 justify-start gap-3 ${
                  action.destructive ? "text-red-400" : ""
                }`}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon className="h-4 w-4 shrink-0" />
                )}
                {action.label}
              </button>
            );
          })}
      </div>
    </AppModal>
  );
}
