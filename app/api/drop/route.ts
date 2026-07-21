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

type DropAttachmentRow = {
  id: string;
  drop_id: string;
  file_url: string;
  content_type: ContentType;
  created_at: string;
};

type DropRow = {
  id: string;
  content: string | null;
  user_id: string;
  created_at: string;
  expires_at: string;
  attachments: DropAttachmentRow[];
};

const jsonPayloadSchema = z
  .object({
    content: z.string().trim().max(10000).optional(),
    fileUrl: z.string().trim().max(2048).optional(),
    file_url: z.string().trim().max(2048).optional(),
    /** Base64 del archivo (atajos iOS); admite data URL. */
    fileBase64: z.string().min(1).optional(),
    file_base64: z.string().min(1).optional(),
    base64: z.string().min(1).optional(),
    imageBase64: z.string().min(1).optional(),
    filename: z.string().trim().max(255).optional(),
    mimeType: z.string().trim().max(128).optional(),
    mime_type: z.string().trim().max(128).optional(),
  })
  .passthrough();

function blobFromBase64(
  raw: string,
  mimeType: string,
  filename: string,
): File {
  const cleaned = raw.includes(",") ? raw.split(",").pop()! : raw;
  const bytes = Buffer.from(cleaned.replace(/\s/g, ""), "base64");
  return new File([bytes], filename, { type: mimeType });
}

function pickBase64(data: Record<string, unknown>): string | null {
  const keys = [
    "fileBase64",
    "file_base64",
    "base64",
    "imageBase64",
    "image_base64",
  ];
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return null;
}

async function uploadDropAttachment(
  userId: string,
  file: Blob & { name?: string; type: string },
): Promise<{ file_url: string; content_type: ContentType }> {
  const mime = file.type || "application/octet-stream";
  const ct = mimeToContentType(mime);
  const ext = extensionFromUpload(file);
  const filePath = await uploadFile(
    createAdminClient(),
    userId,
    "drops",
    file,
    ext,
  );
  return { file_url: filePath, content_type: ct };
}

async function attachmentFromBase64(
  userId: string,
  b64: string,
  mimeHint?: string | null,
  filenameHint?: string | null,
): Promise<{ file_url: string; content_type: ContentType } | null> {
  const mime =
    mimeHint?.trim() ||
    (b64.startsWith("data:")
      ? b64.slice(5, b64.indexOf(";")) || "image/jpeg"
      : "image/jpeg");
  const filename =
    filenameHint?.trim() ||
    `upload.${extensionFromUpload({ type: mime, name: "" })}`;
  const file = blobFromBase64(b64, mime, filename);
  if (file.size <= 0) return null;
  return uploadDropAttachment(userId, file);
}

function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return null;
  const token = match[1].trim();
  return token.length > 0 ? token : null;
}

function extensionFromUpload(file: Blob & { name?: string }): string {
  const name = file.name ?? "";
  if (name.includes(".")) {
    const fromName = name.split(".").pop()?.toLowerCase();
    if (fromName) return fromName;
  }

  const mime = (file.type || "").toLowerCase();
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/heic") return "heic";
  if (mime === "image/heif") return "heif";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  if (mime.startsWith("video/")) return "mp4";
  if (mime.startsWith("audio/")) return "m4a";
  return "bin";
}

function asUploadBlob(
  value: FormDataEntryValue | null,
): (Blob & { name?: string; type: string }) | null {
  if (value == null || typeof value === "string") return null;
  if (!(value instanceof Blob) || value.size <= 0) return null;
  return value;
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
    .select("id, content, user_id, created_at, expires_at, attachments:drop_attachments(*)")
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
  let attachments: { file_url: string; content_type: ContentType }[] = [];
  let debugKeys: string[] = [];

  try {
    if (contentTypeHeader.includes("multipart/form-data")) {
      const formData = await request.formData();
      debugKeys = [...new Set(formData.keys())];
      const rawContent = formData.get("content") ?? formData.get("text");
      const file =
        asUploadBlob(formData.get("file")) ??
        asUploadBlob(formData.get("image")) ??
        asUploadBlob(formData.get("photo"));

      if (typeof rawContent === "string") content = rawContent.trim() || null;

      if (file) {
        attachments = [await uploadDropAttachment(auth.userId, file)];
      } else {
        const formRecord: Record<string, unknown> = {};
        for (const key of debugKeys) {
          const value = formData.get(key);
          if (typeof value === "string") formRecord[key] = value;
        }
        const b64 = pickBase64(formRecord);
        if (b64) {
          const attached = await attachmentFromBase64(
            auth.userId,
            b64,
            typeof formRecord.mimeType === "string"
              ? formRecord.mimeType
              : typeof formRecord.mime_type === "string"
                ? formRecord.mime_type
                : null,
            typeof formRecord.filename === "string" ? formRecord.filename : null,
          );
          if (attached) attachments = [attached];
        }
      }
    } else {
      const json = (await request.json()) as Record<string, unknown>;
      debugKeys = Object.keys(json);
      const parsed = jsonPayloadSchema.parse(json);
      content = parsed.content?.trim() || null;

      const fileUrl = parsed.file_url?.trim() ?? parsed.fileUrl?.trim() ?? null;
      if (fileUrl) {
        attachments = [{ file_url: fileUrl, content_type: "file" }];
      }

      const b64 = pickBase64(parsed as Record<string, unknown>);
      if (b64 && attachments.length === 0) {
        const attached = await attachmentFromBase64(
          auth.userId,
          b64,
          parsed.mimeType ?? parsed.mime_type,
          parsed.filename,
        );
        if (attached) attachments = [attached];
      }
    }
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la petición inválido", contentType: contentTypeHeader },
      { status: 400 },
    );
  }

  if (!content && attachments.length === 0) {
    return NextResponse.json(
      {
        error: "content o un archivo requerido",
        hint: "Usa JSON con fileBase64 (Texto) o Formulario con file (archivo). Claves recibidas abajo.",
        receivedKeys: debugKeys,
        contentType: contentTypeHeader,
      },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data, error: rpcError } = await admin.rpc(
    "insert_drop_with_attachments",
    {
      p_content: content,
      p_user_id: auth.userId,
      p_attachments: attachments,
    },
  );

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 500 });
  }

  await touchToken(auth.tokenHash);

  return NextResponse.json({ ok: true, drop: data as DropRow });
}
