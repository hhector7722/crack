import { createClient } from "@/lib/supabase/client";
import { createItem, triggerEmbed } from "@/lib/items";
import { uploadFile } from "@/lib/storage";

export async function uploadImageFromFile(file: File): Promise<void> {
  const supabase = createClient();

  const { data: { user }, error: sessionError } = await supabase.auth.getUser();
  if (sessionError || !user) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token ?? "",
      });
    }
    const { data: { user: retriedUser } } = await supabase.auth.getUser();
    if (!retriedUser) throw new Error("No autenticado. Intenta cerrar sesión y volver a iniciarla.");
  }

  const { data: { user: finalUser } } = await supabase.auth.getUser();
  if (!finalUser) throw new Error("No autenticado");

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = await uploadFile(supabase, finalUser.id, "images", file, ext);

  const item = await createItem(supabase, {
    type: "image",
    title: file.name.replace(/\.[^.]+$/, "") || "Imagen",
    file_url: path,
    user_id: finalUser.id,
    metadata: {},
  });
  triggerEmbed(item.id);
}
