import type { SupabaseClient } from "@supabase/supabase-js";
import type { Item, ItemMetadata, ItemType } from "./types";

export async function fetchItems(
  supabase: SupabaseClient,
  filter?: ItemType
): Promise<Item[]> {
  let query = supabase
    .from("items")
    .select("*")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (filter) {
    query = query.eq("type", filter);
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
