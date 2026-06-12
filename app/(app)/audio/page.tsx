"use client";

import { ItemFeed } from "@/components/item-feed";
import { useRefreshKey } from "../layout";

export default function AudioPage() {
  const refreshKey = useRefreshKey();
  return <ItemFeed filter="audio" refreshKey={refreshKey} />;
}
