"use client";

import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import { useSignedUrl } from "@/lib/drop/signed-url-cache";

const THUMB_CLASS = "h-[4.5rem] w-[4.5rem] shrink-0";

export function BubbleImage({
  path,
  onLoad,
  onExpand,
}: {
  path: string;
  onLoad?: () => void;
  onExpand: () => void;
}) {
  const url = useSignedUrl(path);

  useEffect(() => {
    if (url) onLoad?.();
  }, [url, onLoad]);

  if (!url) {
    return (
      <div
        className={`flex ${THUMB_CLASS} items-center justify-center rounded-lg bg-zinc-800`}
      >
        <ImageIcon className="h-5 w-5 text-zinc-500" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onExpand}
      aria-label="Ver imagen"
      className={`block overflow-hidden rounded-lg ${THUMB_CLASS}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Drop imagen"
        className="h-full w-full object-cover"
        onLoad={onLoad}
      />
    </button>
  );
}
