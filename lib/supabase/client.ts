import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/env";

/** Logs temporales de diagnóstico Realtime — eliminar cuando Drop esté estable. */
const DROP_RT_LOG = process.env.NODE_ENV !== "production";

function rtLog(...args: unknown[]) {
  if (DROP_RT_LOG) {
    console.log("[Drop RT]", new Date().toISOString(), ...args);
  }
}

let browserClient: SupabaseClient | null = null;

export function createClient() {
  const config = getSupabasePublicConfig();
  if (!config.ok) {
    throw new Error(config.error);
  }

  if (browserClient) {
    return browserClient;
  }

  browserClient = createBrowserClient(config.url, config.anonKey, {
    realtime: {
      // Evita que el throttling de pestañas en segundo plano corte los heartbeats.
      worker: true,
      heartbeatCallback: (status) => {
        rtLog("heartbeat", status, {
          socketConnected: browserClient?.realtime.isConnected() ?? false,
        });
        if (status === "disconnected" || status === "timeout") {
          rtLog("heartbeat → reconectando socket");
          browserClient?.realtime.connect();
        }
      },
    },
  });

  return browserClient;
}

export function getSupabaseConfigError(): string | null {
  const config = getSupabasePublicConfig();
  return config.ok ? null : config.error;
}
