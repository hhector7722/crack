"use client";

import { ImageIcon } from "lucide-react";
import { useSignedUrl } from "@/lib/drop/signed-url-cache";

export function BubbleImage({ path }: { path: string }) {
  const url = useSignedUrl(path);

  if (!url)
    return (
      <div className="flex h-40 w-56 items-center justify-center rounded-lg bg-zinc-800">
        <ImageIcon className="h-6 w-6 text-zinc-500" />
      </div>
    );

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt="Drop imagen"
      className="max-h-64 max-w-[14rem] rounded-lg object-cover"
      loading="lazy"
    />
  );
}
