import type { SupabaseClient } from "@supabase/supabase-js";
import { createItem } from "@/lib/items";
import { titleFromUrl, fetchLinkPreview } from "@/lib/link-preview";
import { extractFirstUrl } from "@/lib/utils";

export function resolveSharedUrl(input: {
  url?: string | null;
  text?: string | null;
  title?: string | null;
}): string | null {
  const direct = input.url?.trim();
  if (direct && extractFirstUrl(direct)) {
    return extractFirstUrl(direct);
  }

  const fromText = extractFirstUrl(input.text);
  if (fromText) return fromText;

  const fromTitle = extractFirstUrl(input.title);
  if (fromTitle) return fromTitle;

  return null;
}

export function resolveSharedTitle(
  url: string,
  title?: string | null,
  text?: string | null
): string {
  const trimmed = title?.trim();
  if (trimmed && !extractFirstUrl(trimmed)) {
    return trimmed.slice(0, 120);
  }

  const textLine = text?.trim().split("\n")[0]?.slice(0, 120);
  if (textLine && !extractFirstUrl(textLine)) {
    return textLine;
  }

  return titleFromUrl(url);
}

export async function saveSharedLink(
  supabase: SupabaseClient,
  userId: string,
  input: { url?: string | null; text?: string | null; title?: string | null }
) {
  const url = resolveSharedUrl(input);
  if (!url) {
    throw new Error("No se encontró ninguna URL válida");
  }

  const noteTitle = resolveSharedTitle(url, input.title, input.text);

  const preview = await fetchLinkPreview(url);

  const metadata: Record<string, unknown> = {
    classification_type: "note",
    summary: preview.title ?? noteTitle,
  };

  if (preview.image) {
    metadata.link_image = preview.image;
  }
  if (preview.title) {
    metadata.link_title = preview.title;
  }
  if (preview.description) {
    metadata.link_description = preview.description;
  }

  return createItem(supabase, {
    type: "note",
    title: preview.title ?? noteTitle,
    content: url,
    user_id: userId,
    metadata,
  });
}
