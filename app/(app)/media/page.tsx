"use client";

import { ItemFeed } from "@/components/item-feed";
import { useRefreshKey } from "../layout";

export default function MediaPage() {
  const refreshKey = useRefreshKey();
  return <ItemFeed filter="image" refreshKey={refreshKey} />;
}
