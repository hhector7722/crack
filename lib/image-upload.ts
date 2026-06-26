import { createClient } from "@/lib/supabase/client";
import { createItem, triggerEmbed } from "@/lib/items";
import { uploadFile } from "@/lib/storage";

export async function uploadImageFromFile(file: File): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = await uploadFile(supabase, user.id, "images", file, ext);

  const item = await createItem(supabase, {
    type: "image",
    title: file.name.replace(/\.[^.]+$/, "") || "Imagen",
    file_url: path,
    user_id: user.id,
    metadata: {},
  });
  triggerEmbed(item.id);
}
