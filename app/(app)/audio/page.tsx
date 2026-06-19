"use client";

import { AudioFeed } from "@/components/audio-feed";
import { useRefreshKey } from "../layout";

export default function AudioPage() {
  const refreshKey = useRefreshKey();

  return <AudioFeed refreshKey={refreshKey} />;
}
