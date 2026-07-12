"use client";

import { Loader2 } from "lucide-react";
import { useSignedUrl } from "@/lib/drop/signed-url-cache";

export function BubbleVideo({ path }: { path: string }) {
  const url = useSignedUrl(path);

  if (!url)
    return (
      <div className="flex h-40 w-56 items-center justify-center rounded-lg bg-zinc-800">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
      </div>
    );

  return (
    <video
      controls
      src={url}
      className="max-h-64 max-w-[14rem] rounded-lg"
      playsInline
    />
  );
}
