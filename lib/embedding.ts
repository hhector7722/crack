import type { SupabaseClient } from "@supabase/supabase-js";
import type { Item } from "./types";

export const EMBEDDING_MODEL = "@cf/baai/bge-m3";
export const EMBEDDING_DIMENSIONS = 1024;

export function embeddingsConfigured(): boolean {
  return Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN);
}

export function buildEmbeddingText(item: Pick<Item, "type" | "title" | "content" | "metadata">): string {
  const m = item.metadata ?? {};
  return [
    item.title, item.content, m.summary, m.link_title,
    m.link_description, m.tags?.join(", "), m.raw_transcript,
  ].filter(Boolean).join("\n\n").trim().slice(0, 6000);
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!account || !token) throw new Error("Configura Cloudflare Workers AI para activar la búsqueda semántica.");
  if (!text.trim()) throw new Error("No hay texto indexable.");
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/ai/run/@cf/baai/bge-m3`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text: [text.slice(0, 6000)] }),
      signal: AbortSignal.timeout(25000),
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error(res.status === 429 ? "Cuota gratuita de Cloudflare agotada." : `Error Cloudflare (${res.status})`);
  const payload: unknown = await res.json();
  const result = (payload as { result?: { data?: unknown }; success?: boolean }).result;
  const first = Array.isArray(result?.data) ? result.data[0] : null;
  const embedding = Array.isArray(first) ? first :
    (first && typeof first === "object" && "values" in first ? (first as { values: unknown }).values : null);
  if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSIONS ||
      !embedding.every((value) => typeof value === "number" && Number.isFinite(value))) {
    throw new Error("Cloudflare devolvió un vector incompatible.");
  }
  return embedding as number[];
}

export async function generateItemEmbedding(item: Pick<Item, "type" | "title" | "content" | "metadata">): Promise<number[]> {
  const text = buildEmbeddingText(item);
  if (!text) throw new Error("Este elemento no tiene contenido textual indexable.");
  return generateEmbedding(text);
}

export async function saveEmbedding(supabase: SupabaseClient, itemId: string, embedding: number[]): Promise<void> {
  const { error } = await supabase.from("items").update({
    knowledge_embedding: embedding,
    embedding_model: EMBEDDING_MODEL,
  }).eq("id", itemId);
  if (error) throw new Error(`Error guardando embedding: ${error.message}`);
}

export async function updateItemEmbedding(
  supabase: SupabaseClient,
  item: Pick<Item, "id" | "type" | "title" | "content" | "metadata">
): Promise<void> {
  if (!embeddingsConfigured() || (item.metadata as Record<string, unknown>)?.extra === true) return;
  try {
    const embedding = await generateItemEmbedding(item);
    await saveEmbedding(supabase, item.id, embedding);
  } catch (err) {
    console.error("[knowledge embedding]", err);
  }
}

const queryCache = new Map<string, { value: number[]; time: number }>();
export async function getQueryEmbedding(query: string): Promise<number[]> {
  const key = query.trim().toLocaleLowerCase();
  const cached = queryCache.get(key);
  if (cached && Date.now() - cached.time < 30 * 60_000) return cached.value;
  const value = await generateEmbedding(query);
  if (queryCache.size >= 200) queryCache.clear();
  queryCache.set(key, { value, time: Date.now() });
  return value;
}
