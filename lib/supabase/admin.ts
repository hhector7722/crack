import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/env";

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdminConfig():
  | { ok: true; url: string; serviceRoleKey: string }
  | { ok: false; error: string } {
  const config = getSupabasePublicConfig();
  if (!config.ok) {
    return config;
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  if (!serviceRoleKey) {
    return {
      ok: false,
      error:
        "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor (Vercel → Environment Variables).",
    };
  }

  return { ok: true, url: config.url, serviceRoleKey };
}

export function createAdminClient(): SupabaseClient {
  const config = getSupabaseAdminConfig();
  if (!config.ok) {
    throw new Error(config.error);
  }

  if (!adminClient) {
    adminClient = createClient(config.url, config.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return adminClient;
}
