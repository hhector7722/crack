import { createClient } from "@/lib/supabase/client";
import { createItem, triggerEmbed } from "@/lib/items";
import { uploadFile } from "@/lib/storage";
import type { ItemType } from "@/lib/types";

const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "webm", "m4v", "avi", "mkv", "3gp"]);

export function detectMediaType(file: File): Extract<ItemType, "image" | "video"> {
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("image/")) return "image";

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (VIDEO_EXTENSIONS.has(ext)) return "video";
  return "image";
}

async function ensureAuthenticatedUser() {
  const supabase = createClient();

  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser();

  if (sessionError || !user) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token ?? "",
      });
    }
    const {
      data: { user: retriedUser },
    } = await supabase.auth.getUser();
    if (!retriedUser) {
      throw new Error("No autenticado. Intenta cerrar sesión y volver a iniciarla.");
    }
    return { supabase, user: retriedUser };
  }

  return { supabase, user };
}

export async function uploadMediaFromFile(file: File): Promise<ItemType> {
  const { supabase, user } = await ensureAuthenticatedUser();
  const mediaType = detectMediaType(file);
  const ext = file.name.split(".").pop()?.toLowerCase() ?? (mediaType === "video" ? "mp4" : "jpg");
  const path = await uploadFile(supabase, user.id, "images", file, ext);

  const defaultTitle = mediaType === "video" ? "Vídeo" : "Imagen";
  const item = await createItem(supabase, {
    type: mediaType,
    title: file.name.replace(/\.[^.]+$/, "") || defaultTitle,
    file_url: path,
    user_id: user.id,
    metadata: {},
  });
  triggerEmbed(item.id);
  return mediaType;
}

/** @deprecated Usa uploadMediaFromFile */
export async function uploadImageFromFile(file: File): Promise<void> {
  await uploadMediaFromFile(file);
}
