import OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Item } from "./types";

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function buildEmbeddingText(item: Pick<Item, "type" | "title" | "content" | "metadata">): string {
  const parts: string[] = [];

  if (item.title) parts.push(item.title);
  if (item.content) parts.push(item.content);

  const m = item.metadata;
  if (m.summary) parts.push(m.summary);
  if (m.tags?.length) parts.push(m.tags.join(", "));
  if (m.raw_transcript) parts.push(m.raw_transcript);
  if (m.link_title) parts.push(m.link_title);
  if (m.link_description) parts.push(m.link_description);

  return parts.join("\n\n").trim();
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getClient();
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.slice(0, 8000),
    dimensions: EMBEDDING_DIMENSIONS,
  });
  return response.data[0].embedding;
}

export async function generateItemEmbedding(item: Pick<Item, "type" | "title" | "content" | "metadata">): Promise<number[]> {
  const text = buildEmbeddingText(item);
  if (!text) throw new Error("No hay contenido para generar embedding");
  return generateEmbedding(text);
}

export async function saveEmbedding(
  supabase: SupabaseClient,
  itemId: string,
  embedding: number[]
): Promise<void> {
  const { error } = await supabase
    .from("items")
    .update({
      embedding,
      embedding_model: EMBEDDING_MODEL,
    })
    .eq("id", itemId);

  if (error) {
    throw new Error(`Error guardando embedding: ${error.message}`);
  }
}

export async function updateItemEmbedding(
  supabase: SupabaseClient,
  item: Pick<Item, "id" | "type" | "title" | "content" | "metadata">
): Promise<void> {
  try {
    const embedding = await generateItemEmbedding(item);
    await saveEmbedding(supabase, item.id, embedding);
  } catch (err) {
    console.error(`Error generando embedding para item ${item.id}:`, err);
  }
}

type LRUCacheEntry = { embedding: number[]; timestamp: number };

const QUERY_CACHE = new Map<string, LRUCacheEntry>();
const QUERY_CACHE_MAX = 1000;
const QUERY_CACHE_TTL_MS = 1000 * 60 * 30;

export function getCachedQueryEmbedding(query: string): number[] | null {
  const entry = QUERY_CACHE.get(query);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > QUERY_CACHE_TTL_MS) {
    QUERY_CACHE.delete(query);
    return null;
  }
  return entry.embedding;
}

export function setCachedQueryEmbedding(query: string, embedding: number[]): void {
  if (QUERY_CACHE.size >= QUERY_CACHE_MAX) {
    const oldest = QUERY_CACHE.keys().next().value;
    if (oldest !== undefined) QUERY_CACHE.delete(oldest);
  }
  QUERY_CACHE.set(query, { embedding, timestamp: Date.now() });
}

export async function getQueryEmbedding(query: string): Promise<number[]> {
  const cached = getCachedQueryEmbedding(query);
  if (cached) return cached;

  const embedding = await generateEmbedding(query);
  setCachedQueryEmbedding(query, embedding);
  return embedding;
}
