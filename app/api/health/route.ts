import { NextResponse } from "next/server";
import { getSupabasePublicConfig } from "@/lib/env";

export async function GET() {
  const config = getSupabasePublicConfig();

  return NextResponse.json({
    supabase: config.ok ? "ok" : config.error,
    ownerEmail: process.env.OWNER_EMAIL ? "configured" : "missing",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "not set",
  });
}
