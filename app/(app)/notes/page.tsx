"use client";

import { ItemFeed } from "@/components/item-feed";
import { useRefreshKey } from "../layout";

export default function NotesPage() {
  const refreshKey = useRefreshKey();
  return <ItemFeed filter="note" refreshKey={refreshKey} />;
}
