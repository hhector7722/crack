"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useBumpRefresh } from "@/app/(app)/layout";

export function UrlSyncObserver() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bumpRefresh = useBumpRefresh();
  const handledRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const id = searchParams.get("id");
    if (id && !handledRef.current.has(id)) {
      handledRef.current.add(id);
      
      // Clean up the URL so it doesn't stay there on subsequent reloads
      const newUrl = window.location.pathname;
      router.replace(newUrl, { scroll: false });
      
      // We found a new incoming share! Trigger a refresh so it fetches the new item.
      bumpRefresh();
    }
  }, [searchParams, router, bumpRefresh]);

  return null;
}
