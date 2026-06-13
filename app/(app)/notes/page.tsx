"use client";

import { PenLine } from "lucide-react";
import { ItemFeed } from "@/components/item-feed";
import { useAppShell } from "@/components/app-shell-context";
import { useRefreshKey } from "../layout";

export default function NotesPage() {
  const refreshKey = useRefreshKey();
  const { openCapture } = useAppShell();

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => openCapture("note")}
        className="action-ghost"
      >
        <PenLine className="h-5 w-5" />
        Nueva nota
      </button>
      <ItemFeed filter="note" refreshKey={refreshKey} />
    </div>
  );
}
