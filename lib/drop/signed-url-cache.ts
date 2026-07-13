import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSignedUrl } from "@/lib/storage";

const CACHE_TTL = 55 * 60 * 1000; // 55 min (URLs expiran a 60 min)

const signedCache = new Map<string, { url: string; expiresAt: number }>();

export async function getOrFetchSignedUrl(path: string): Promise<string> {
  const cached = signedCache.get(path);
  if (cached && Date.now() < cached.expiresAt) return cached.url;

  const supabase = createClient();
  const url = await getSignedUrl(supabase, path, 3600);
  signedCache.set(path, { url, expiresAt: Date.now() + CACHE_TTL });
  return url;
}

export async function downloadSignedFile(path: string, filename?: string) {
  const url = await getOrFetchSignedUrl(path);
  const name = filename ?? path.split("/").pop() ?? "drop-file";
  const response = await fetch(url);
  if (!response.ok) throw new Error("No se pudo descargar el archivo");

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(blobUrl);
}

export function useSignedUrl(path: string): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getOrFetchSignedUrl(path).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return url;
}
