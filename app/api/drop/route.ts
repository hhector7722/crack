import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, getSupabaseAdminConfig } from "@/lib/supabase/admin";
import { hashShareToken, tokensMatch } from "@/lib/share-token";
import { uploadFile } from "@/lib/storage";

type ContentType = "text" | "image" | "audio" | "video" | "file";

function mimeToContentType(mime: string): ContentType {
  const m = mime.toLowerCase();
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("audio/")) return "audio";
  if (m.startsWith("video/")) return "video";
  return "file";
}

const jsonPayloadSchema = z.object({
  content: z.string().trim().max(10000).optional(),
  fileUrl: z.string().trim().max(2048).optional(),
  file_url: z.string().trim().max(2048).optional(),
});

type DropRow = {
  id: string;
  content: string | null;
  file_url: string | null;
  content_type: ContentType;
  user_id: string;
  created_at: string;
  expires_at: string;
};

function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

async function getUserIdFromToken(token: string) {
  const admin = createAdminClient();
  const tokenHash = hashShareToken(token);

  const { data: row, error } = await admin
    .from("share_tokens")
    .select("user_id, token_hash")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    return { error: NextResponse.json({ error: error.message }, { status: 500 }) };
  }

  if (!row || !tokensMatch(token, row.token_hash)) {
    return { error: NextResponse.json({ error: "Token inválido" }, { status: 401 }) };
  }

  return { userId: row.user_id as string, tokenHash };
}

async function touchToken(tokenHash: string) {
  const admin = createAdminClient();
  await admin
    .from("share_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("token_hash", tokenHash);
}

export async function GET(request: Request) {
  const adminConfig = getSupabaseAdminConfig();
  if (!adminConfig.ok) {
    return NextResponse.json({ error: adminConfig.error }, { status: 503 });
  }

  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Token requerido" }, { status: 401 });
  }

  const auth = await getUserIdFromToken(token);
  if (auth.error) return auth.error;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("drops")
    .select("id, content, file_url, content_type, user_id, created_at, expires_at")
    .eq("user_id", auth.userId)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await touchToken(auth.tokenHash);

  return NextResponse.json({ drops: (data ?? []) as DropRow[] });
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

  const auth = await getUserIdFromToken(token);
  if (auth.error) return auth.error;

  const contentTypeHeader = request.headers.get("content-type") ?? "";
  let content: string | null = null;
  let fileUrl: string | null = null;
  let dropContentType: ContentType = "text";

  try {
    if (contentTypeHeader.includes("multipart/form-data")) {
      const formData = await request.formData();
      const rawContent = formData.get("content") ?? formData.get("text");
      const rawFileUrl = formData.get("file_url") ?? formData.get("fileUrl");
      const file = formData.get("file");

      if (typeof rawContent === "string") content = rawContent.trim() || null;
      if (typeof rawFileUrl === "string") fileUrl = rawFileUrl.trim() || null;

      if (file instanceof File && file.size > 0) {
        dropContentType = mimeToContentType(file.type);
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
        fileUrl = await uploadFile(
          createAdminClient(),
          auth.userId,
          "drops",
          file,
          ext,
        );
      } else if (content) {
        dropContentType = "text";
      }
    } else {
      const json = await request.json();
      const parsed = jsonPayloadSchema.parse(json);
      content = parsed.content?.trim() || null;
      fileUrl = parsed.file_url?.trim() ?? parsed.fileUrl?.trim() ?? null;
      dropContentType = "text";
    }
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la petición inválido" },
      { status: 400 },
    );
  }

  if (!content && !fileUrl) {
    return NextResponse.json(
      { error: "content o file_url requerido" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("drops")
    .insert({
      content,
      file_url: fileUrl,
      content_type: dropContentType,
      user_id: auth.userId,
    })
    .select("id, content, file_url, content_type, user_id, created_at, expires_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await touchToken(auth.tokenHash);

  return NextResponse.json({ ok: true, drop: data as DropRow });
}
