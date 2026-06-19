"use client";

import { GalleryFeed } from "@/components/gallery-feed";
import { useRefreshKey } from "../layout";

export default function MediaPage() {
  const refreshKey = useRefreshKey();

  return <GalleryFeed refreshKey={refreshKey} columns={5} />;
}
