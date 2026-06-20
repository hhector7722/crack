import { NextResponse } from "next/server";
import { z } from "zod";
import { saveSharedLink } from "@/lib/share-link-save";
import { createAdminClient, getSupabaseAdminConfig } from "@/lib/supabase/admin";
import { hashShareToken, tokensMatch } from "@/lib/share-token";

const payloadSchema = z.object({
  url: z.string().optional(),
  text: z.string().optional(),
  title: z.string().optional(),
});

function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

async function saveWithToken(token: string, payload: z.infer<typeof payloadSchema>) {
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

  const item = await saveSharedLink(admin, row.user_id, payload);

  await admin
    .from("share_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("token_hash", tokenHash);

  return NextResponse.json({ ok: true, id: item.id });
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

  let body: z.infer<typeof payloadSchema>;
  try {
    const json = await request.json();
    body = payloadSchema.parse(json);
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido" }, { status: 400 });
  }

  try {
    return await saveWithToken(token, body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error guardando enlace";
    const status = message.includes("URL") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
