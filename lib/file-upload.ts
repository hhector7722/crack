import { createClient } from "@/lib/supabase/client";
import { createItem, triggerEmbed } from "@/lib/items";
import { uploadFile } from "@/lib/storage";

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

export async function uploadFileFromPicker(file: File): Promise<void> {
  const { supabase, user } = await ensureAuthenticatedUser();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = await uploadFile(supabase, user.id, "files", file, ext);

  const item = await createItem(supabase, {
    type: "file",
    title: file.name.replace(/\.[^.]+$/, "") || "Archivo",
    file_url: path,
    user_id: user.id,
    metadata: {},
  });
  triggerEmbed(item.id);
}
