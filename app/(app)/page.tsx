"use client";

import { ItemFeed } from "@/components/item-feed";
import { useRefreshKey } from "./layout";

export default function HomePage() {
  const refreshKey = useRefreshKey();
  return <ItemFeed refreshKey={refreshKey} />;
}
