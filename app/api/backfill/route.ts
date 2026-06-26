import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateItemEmbedding, saveEmbedding } from "@/lib/embedding";
import type { Item } from "@/lib/types";

const BATCH_SIZE = 10;

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const { data: items, error: fetchError, count } = await supabase
    .from("items")
    .select("id, type, title, content, metadata", { count: "exact" })
    .eq("user_id", user.id)
    .is("embedding", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + BATCH_SIZE - 1);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const total = count ?? 0;
  const results: { id: string; ok: boolean; error?: string }[] = [];

  for (const item of items as Pick<Item, "id" | "type" | "title" | "content" | "metadata">[]) {
    try {
      const embedding = await generateItemEmbedding(item);
      await saveEmbedding(supabase, item.id, embedding);
      results.push({ id: item.id, ok: true });
    } catch (err) {
      results.push({
        id: item.id,
        ok: false,
        error: err instanceof Error ? err.message : "Error desconocido",
      });
    }
  }

  const remaining = Math.max(0, total - (offset + BATCH_SIZE));

  return NextResponse.json({
    processed: results.length,
    total,
    remaining,
    next_offset: remaining > 0 ? offset + BATCH_SIZE : null,
    results,
  });
}
