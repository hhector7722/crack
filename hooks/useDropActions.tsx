"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  copyDrop,
  deleteDrop,
  saveDropToCrack,
  saveDropToDevice,
  shareDrop,
} from "@/lib/drop/drop-actions";
import type { Drop } from "@/lib/drop/types";
import {
  DropActionSheet,
  type DropActionId,
} from "@/components/drop/DropActionSheet";

export function useDropActions({
  userId,
  onDeleted,
}: {
  userId: string;
  onDeleted: (dropId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedDrop, setSelectedDrop] = useState<Drop | null>(null);

  const openActions = useCallback((drop: Drop) => {
    setSelectedDrop(drop);
    setOpen(true);
  }, []);

  const handleAction = useCallback(
    async (action: DropActionId, drop: Drop) => {
      const supabase = createClient();

      switch (action) {
        case "copy":
          await copyDrop(drop);
          return;
        case "share":
          await shareDrop(drop);
          return;
        case "save":
          await saveDropToDevice(drop);
          return;
        case "crack":
          await saveDropToCrack(supabase, userId, drop);
          return;
        case "delete":
          await deleteDrop(supabase, drop);
          onDeleted(drop.id);
          return;
      }
    },
    [onDeleted, userId]
  );

  const sheet = (
    <DropActionSheet
      open={open}
      onOpenChange={setOpen}
      drop={selectedDrop}
      onAction={handleAction}
    />
  );

  return { openActions, sheet };
}
