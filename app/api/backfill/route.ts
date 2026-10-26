import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { embeddingsConfigured, generateItemEmbedding, saveEmbedding, buildEmbeddingText } from "@/lib/embedding";
import type { Item } from "@/lib/types";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!embeddingsConfigured()) return NextResponse.json({ error: "Configura CLOUDFLARE_ACCOUNT_ID y CLOUDFLARE_API_TOKEN en Vercel." }, { status: 503 });

  // Batches repetibles sin offset: el conjunto disminuye tras guardar cada vector.
  const { data, error } = await supabase.from("items")
    .select("id,type,title,content,metadata")
    .eq("user_id", user.id)
    .not("metadata", "cs", '{"extra":true}')
    .is("knowledge_embedding", null)
    .order("created_at", { ascending: false })
    .limit(8);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let indexed = 0;
  const errors: string[] = [];
  for (const item of (data ?? []) as Pick<Item, "id" | "type" | "title" | "content" | "metadata">[]) {
    if (!buildEmbeddingText(item)) continue;
    try {
      await saveEmbedding(supabase, item.id, await generateItemEmbedding(item));
      indexed++;
    } catch (err) {
      errors.push(err instanceof Error ? err.message : "Error indexando");
      // Evitamos gastar la cuota gratuita reiterando una respuesta 429/5xx.
      break;
    }
  }
  return NextResponse.json({ indexed, processed: data?.length ?? 0, has_more: (data?.length ?? 0) === 8 && errors.length === 0 && indexed > 0, error: errors[0] ?? null });
}
