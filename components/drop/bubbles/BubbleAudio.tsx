"use client";

import { useSignedUrl } from "@/lib/drop/signed-url-cache";

export function BubbleAudio({ path }: { path: string }) {
  const url = useSignedUrl(path);

  if (!url)
    return <div className="h-10 w-52 animate-pulse rounded-full bg-zinc-800" />;

  return (
    <audio controls src={url} className="w-52 accent-violet-500" />
  );
}
