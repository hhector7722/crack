import { NextResponse } from "next/server";
import { z } from "zod";
import { saveSharedLink } from "@/lib/share-link-save";
import { createAdminClient, getSupabaseAdminConfig } from "@/lib/supabase/admin";
import { hashShareToken, tokensMatch } from "@/lib/share-token";
import { uploadFile } from "@/lib/storage";
import { createItem } from "@/lib/items";
import { classifyImage } from "@/lib/ai";
const payloadSchema = z.object({
  url: z.string().optional(),
  text: z.string().optional(),
  title: z.string().optional(),
  imageUrl: z.string().optional(),
});

function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

async function saveWithToken(
  token: string,
  payload: z.infer<typeof payloadSchema>,
  file?: File
) {
  const admin = createAdminClient();
  const tokenHash = hashShareToken(token);

  const { data: row, error: lookupError } = await admin
    .from("share_tokens")
    .select("user_id, token_hash")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  if (!row || !tokensMatch(token, row.token_hash)) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  let itemId: string;

  const imageFile = file || (payload.imageUrl ? await fetchImageFile(payload.imageUrl) : undefined);

  if (imageFile) {
    const ext = imageFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = await uploadFile(admin, row.user_id, "images", imageFile, ext);

    let title = imageFile.name.replace(/\.[^.]+$/, "") || "Imagen compartida";
    let metadata: Record<string, unknown> = {};

    try {
      const result = await classifyImage(imageFile);
      if (result.title) title = result.title;
      metadata = {
        themes: result.themes || [],
        tags: result.tags || [],
        classification_type: result.type,
        summary: result.summary,
      };
    } catch (e) {
      console.error("Error clasificando imagen compartida", e);
    }

    const item = await createItem(admin, {
      type: "image",
      title,
      file_url: path,
      user_id: row.user_id,
      metadata,
    });
    itemId = item.id;
  } else {
    const item = await saveSharedLink(admin, row.user_id, payload);
    itemId = item.id;
  }

  await admin
    .from("share_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("token_hash", tokenHash);

  return NextResponse.json({ ok: true, id: itemId });
}

async function fetchImageFile(imageUrl: string): Promise<File | undefined> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return undefined;
    const blob = await response.blob();
    const contentType = blob.type || "image/jpeg";
    const name = imageUrl.split("/").pop()?.split("?")[0] || "imagen";
    return new File([blob], name, { type: contentType });
  } catch {
    return undefined;
  }
}

export async function GET(request: Request) {
  const adminConfig = getSupabaseAdminConfig();
  if (!adminConfig.ok) {
    return NextResponse.json({ error: adminConfig.error }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.json({ error: "Token requerido" }, { status: 401 });
  }

  const payload = payloadSchema.safeParse({
    url: searchParams.get("url") ?? undefined,
    text: searchParams.get("text") ?? undefined,
    title: searchParams.get("title") ?? undefined,
    imageUrl: searchParams.get("imageUrl") ?? undefined,
  });

  if (!payload.success) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  try {
    return await saveWithToken(token, payload.data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error guardando enlace";
    const status = message.includes("URL") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  const adminConfig = getSupabaseAdminConfig();
  if (!adminConfig.ok) {
    return NextResponse.json({ error: adminConfig.error }, { status: 503 });
  }

  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Token requerido" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";

  let payload: z.infer<typeof payloadSchema> = {};
  let file: File | undefined = undefined;

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const url = formData.get("url") as string | null;
      const text = formData.get("text") as string | null;
      const title = formData.get("title") as string | null;
      const f = formData.get("file") ?? formData.get("image");

      if (url) payload.url = url;
      if (text) payload.text = text;
      if (title) payload.title = title;

      if (f instanceof File) {
        file = f;
      }
    } else {
      const json = await request.json();
      payload = payloadSchema.parse(json);
    }
  } catch {
    return NextResponse.json({ error: "Cuerpo de la petición inválido" }, { status: 400 });
  }

  try {
    return await saveWithToken(token, payload, file);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error guardando enlace";
    const status = message.includes("URL") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
