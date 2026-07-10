"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export function useRealtimeSubscription(
  table: string,
  onChange: (payload: {
    eventType: "INSERT" | "UPDATE" | "DELETE";
    new: Record<string, unknown>;
    old: Record<string, unknown>;
  }) => void,
  filter?: string,
) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Unique ID per hook instance so channels never collide in the singleton client
  const instanceId = useRef(`${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    const supabase = createClient();
    const channelName = `realtime-${table}-${instanceId.current}${filter ? `-${filter}` : ""}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter },
        (payload: {
          eventType: "INSERT" | "UPDATE" | "DELETE";
          new: Record<string, unknown>;
          old: Record<string, unknown>;
        }) => {
          onChangeRef.current(payload);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter]);
}
