import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "crack-files";

export async function uploadFile(
  supabase: SupabaseClient,
  userId: string,
  folder: "images" | "audio",
  file: File | Blob,
  extension: string
): Promise<string> {
  const fileName = `${crypto.randomUUID()}.${extension}`;
  const path = `${userId}/${folder}/${fileName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    contentType: file instanceof File ? file.type : undefined,
  });

  if (error) {
    throw new Error(`Error subiendo archivo: ${error.message}`);
  }

  return path;
}

export async function getSignedUrl(
  supabase: SupabaseClient,
  path: string,
  expiresIn = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    throw new Error(`Error obteniendo URL: ${error?.message ?? "desconocido"}`);
  }

  return data.signedUrl;
}

export async function deleteFile(
  supabase: SupabaseClient,
  path: string
): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    throw new Error(`Error eliminando archivo: ${error.message}`);
  }
}
