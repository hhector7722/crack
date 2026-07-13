import type { SupabaseClient } from "@supabase/supabase-js";
import type { Item, ItemMetadata, ItemType } from "./types";

export async function fetchItems(
  supabase: SupabaseClient,
  filter?: ItemType | ItemType[],
  opts?: { limit?: number }
): Promise<Item[]> {
  let query = supabase
    .from("items")
    .select("*")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (filter) {
    if (Array.isArray(filter)) {
      query = query.in("type", filter);
    } else {
      query = query.eq("type", filter);
    }
  }
  if (opts?.limit) {
    query = query.limit(opts.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error cargando items: ${error.message}`);
  }

  return (data ?? []) as Item[];
}

export async function createItem(
  supabase: SupabaseClient,
  item: {
    type: ItemType;
    title?: string | null;
    content?: string | null;
    file_url?: string | null;
    metadata?: ItemMetadata;
    pinned?: boolean;
    user_id: string;
  }
): Promise<Item> {
  const { data, error } = await supabase
    .from("items")
    .insert(item)
    .select()
    .single();

  if (error) {
    throw new Error(`Error creando item: ${error.message}`);
  }

  return data as Item;
}

export async function updateItem(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<
    Pick<Item, "title" | "content" | "metadata" | "pinned" | "file_url">
  >
): Promise<Item> {
  const { data, error } = await supabase
    .from("items")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error actualizando item: ${error.message}`);
  }

  return data as Item;
}

export async function deleteItem(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from("items").delete().eq("id", id);

  if (error) {
    throw new Error(`Error eliminando item: ${error.message}`);
  }
}

export async function togglePin(
  supabase: SupabaseClient,
  id: string,
  pinned: boolean
): Promise<void> {
  const { error } = await supabase
    .from("items")
    .update({ pinned })
    .eq("id", id);

  if (error) {
    throw new Error(`Error actualizando pin: ${error.message}`);
  }
}

export function triggerEmbed(itemId: string): void {
  fetch("/api/embed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item_id: itemId }),
  }).catch(() => {});
}

export function triggerClassify(itemId: string, transcript: string): void {
  fetch("/api/classify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item_id: itemId, transcript }),
  }).catch(() => {});
}

export function triggerTranscribeAudio(itemId: string, blob: Blob): void {
  const mime = blob.type || "audio/webm";
  const ext = mime.includes("mp4") || mime.includes("aac") ? "m4a" : "webm";
  const formData = new FormData();
  formData.append("file", new File([blob], `recording.${ext}`, { type: mime }));
  formData.append("item_id", itemId);

  fetch("/api/transcribe", {
    method: "POST",
    body: formData,
  }).catch(() => {});
}
