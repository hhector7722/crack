import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "@/lib/env";

export function createClient() {
  const config = getSupabasePublicConfig();
  if (!config.ok) {
    throw new Error(config.error);
  }

  return createBrowserClient(config.url, config.anonKey);
}

export function getSupabaseConfigError(): string | null {
  const config = getSupabasePublicConfig();
  return config.ok ? null : config.error;
}
