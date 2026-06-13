"use client";

import { PenLine } from "lucide-react";
import { ItemFeed } from "@/components/item-feed";
import { useAppShell } from "@/components/app-shell-context";
import { useRefreshKey } from "../layout";

export default function NotesPage() {
  const refreshKey = useRefreshKey();
  const { openCapture } = useAppShell();

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => openCapture("note")}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 text-sm font-semibold text-zinc-100 transition-colors active:bg-zinc-800"
      >
        <PenLine className="h-5 w-5" />
        Nueva nota
      </button>
      <ItemFeed filter="note" refreshKey={refreshKey} />
    </div>
  );
}
