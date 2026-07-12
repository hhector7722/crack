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
