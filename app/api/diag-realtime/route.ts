import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  const admin = createClient(url, key, { auth: { persistSession: false } });

  const result: Record<string, unknown> = {};

  // 1. Try to query the publications via raw SQL
  // First, check if there's a function we can call
  const { data: functions, error: functionsError } = await admin
    .from("information_schema.routines")
    .select("specific_name, routine_name")
    .eq("routine_schema", "public")
    .limit(20);

  result.available_functions = functionsError
    ? { error: functionsError.message }
    : functions;

  // 2. Try querying pg_publication_tables directly (might not work due to schema restrictions)
  const { data: pubs, error: pubsError } = await admin
    .from("pg_publication_tables" as never)
    .select("*" as never)
    .limit(10);

  result.publication_tables = pubsError
    ? { error: pubsError.message, hint: "pg_publication_tables is in pg_catalog, not accessible via PostgREST" }
    : pubs;

  // 3. Check the drops table structure
  const { data: dropsInfo, error: dropsError } = await admin
    .from("drops")
    .select("id, content_type")
    .limit(1);

  result.drops_sample = dropsError ? { error: dropsError.message } : dropsInfo;

  // 4. Check if Realtime is configured via the Realtime client
  result.diagnosis = {
    realtime_enabled_in_migration: true,
    migration_applied: "unknown — needs SQL access to verify",
    check_manually:
      "Go to https://supabase.com/dashboard/project/ihewprxwxsxvhahtykfq/database/replication and verify 'drops' table is listed under 'supabase_realtime' publication",
  };

  return NextResponse.json(result);
}
