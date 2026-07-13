import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "crack-files";

export async function uploadFile(
  supabase: SupabaseClient,
  userId: string,
  folder: "images" | "audio" | "drops" | "files",
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

export async function duplicateStorageFile(
  supabase: SupabaseClient,
  sourcePath: string,
  userId: string,
  folder: "images" | "audio" | "files"
): Promise<string> {
  const signedUrl = await getSignedUrl(supabase, sourcePath);
  const response = await fetch(signedUrl);
  if (!response.ok) {
    throw new Error("No se pudo copiar el archivo");
  }

  const blob = await response.blob();
  const ext = sourcePath.split(".").pop()?.toLowerCase() ?? "bin";
  return uploadFile(supabase, userId, folder, blob, ext);
}
