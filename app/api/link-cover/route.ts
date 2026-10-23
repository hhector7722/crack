import { NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { fetchLinkPreview } from "@/lib/link-preview";
import { getNoteUrl } from "@/lib/utils";
import type { Item } from "@/lib/types";

export const runtime = "nodejs";

const inputSchema = z.object({ id: z.string().uuid() });
const maxImageBytes = 5 * 1024 * 1024;
const blocked = new BlockList();

for (const [subnet, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10],
  ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12],
  ["192.168.0.0", 16], ["198.18.0.0", 15], ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  blocked.addSubnet(subnet, prefix, "ipv4");
}
for (const [subnet, prefix] of [
  ["::", 128], ["::1", 128], ["fc00::", 7], ["fe80::", 10],
  ["ff00::", 8], ["::ffff:0:0", 96],
] as const) {
  blocked.addSubnet(subnet, prefix, "ipv6");
}

function youtubeImage(link: string): string | null {
  try {
    const u = new URL(link);
    const host = u.hostname.toLowerCase();
    const id =
      host === "youtu.be" || host === "www.youtu.be"
        ? u.pathname.split("/")[1]
        : ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(host)
          ? u.pathname.startsWith("/shorts/") ? u.pathname.split("/")[2] : u.searchParams.get("v")
          : null;
    return id && /^[\w-]{11}$/.test(id)
      ? `https://img.youtube.com/vi/${id}/hqdefault.jpg`
      : null;
  } catch {
    return null;
  }
}

async function safeImageUrl(value: string): Promise<URL | null> {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.port || url.username || url.password) return null;
    if (isIP(url.hostname) || !url.hostname.includes(".") || url.hostname.toLowerCase().endsWith(".local")) return null;
    const addresses = await lookup(url.hostname, { all: true });
    if (!addresses.length || addresses.some(({ address, family }) =>
      blocked.check(address, family === 4 ? "ipv4" : "ipv6")
    )) return null;
    return url;
  } catch {
    return null;
  }
}

async function downloadImage(value: string): Promise<{ bytes: Uint8Array; mime: string; extension: string } | null> {
  const url = await safeImageUrl(value);
  if (!url) return null;

  try {
    const res = await fetch(url, {
      redirect: "error",
      headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,image/gif" },
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (!res.ok || !res.body) return null;
    const mime = res.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() || "";
    const extensions: Record<string, string> = {
      "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
      "image/gif": "gif", "image/avif": "avif",
    };
    if (!extensions[mime] || Number(res.headers.get("content-length") || 0) > maxImageBytes) {
      await res.body.cancel();
      return null;
    }
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value: chunk } = await reader.read();
      if (done) break;
      size += chunk.byteLength;
      if (size > maxImageBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(chunk);
    }
    if (!size) return null;
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return { bytes, mime, extension: extensions[mime] };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const input = inputSchema.safeParse(body);
  if (!input.success) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("id", input.data.id)
    .eq("user_id", user.id)
    .single();
  if (error || !data) return NextResponse.json({ error: "Enlace no encontrado" }, { status: 404 });
  const item = data as Item;
  const url = getNoteUrl(item);
  if (!url) return NextResponse.json({ error: "No es un enlace" }, { status: 400 });
  if (item.metadata.link_image_path) return NextResponse.json({ item });

  const preview = item.metadata.link_image
    ? null
    : await fetchLinkPreview(url);
  const imageUrl = item.metadata.link_image || preview?.image || youtubeImage(url);
  if (!imageUrl) return NextResponse.json({ saved: false });

  const downloaded = await downloadImage(imageUrl);
  if (!downloaded) return NextResponse.json({ saved: false });

  const path = `${user.id}/images/${crypto.randomUUID()}.${downloaded.extension}`;
  const { error: uploadError } = await supabase.storage
    .from("crack-files")
    .upload(path, downloaded.bytes, { contentType: downloaded.mime, upsert: false });
  if (uploadError) return NextResponse.json({ saved: false });

  const { data: current } = await supabase
    .from("items")
    .select("metadata")
    .eq("id", item.id)
    .eq("user_id", user.id)
    .single();

  if (!current || current.metadata?.link_image_path) {
    await supabase.storage.from("crack-files").remove([path]);
    return NextResponse.json({ saved: false });
  }

  const { data: updated, error: updateError } = await supabase
    .from("items")
    .update({
      metadata: {
        ...current.metadata,
        link_image: imageUrl,
        link_image_path: path,
      },
    })
    .eq("id", item.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (updateError || !updated) {
    await supabase.storage.from("crack-files").remove([path]);
    return NextResponse.json({ saved: false });
  }
  return NextResponse.json({ saved: true, item: updated });
}
