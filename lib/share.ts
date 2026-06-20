import { getNoteUrl } from "@/lib/utils";
import type { Item } from "@/lib/types";

export interface SharePayload {
  title?: string;
  text?: string;
  url?: string;
}

export function buildSharePayload(
  item: Item,
  mediaUrl?: string | null
): SharePayload {
  const link = getNoteUrl(item);
  if (link) {
    return {
      title: item.title ?? "Enlace",
      url: link,
    };
  }

  if (item.type === "image" && mediaUrl) {
    return { title: item.title ?? "Imagen", url: mediaUrl };
  }

  const text =
    item.metadata.raw_transcript ??
    item.metadata.summary ??
    item.content ??
    item.title ??
    "";

  return {
    title: item.title ?? "Crack",
    text,
  };
}

export async function sharePayload(payload: SharePayload): Promise<boolean> {
  const data: ShareData = {
    title: payload.title,
    text: payload.text,
    url: payload.url,
  };

  if (navigator.share) {
    try {
      await navigator.share(data);
      return true;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return false;
    }
  }

  const fallback = payload.url ?? payload.text ?? payload.title ?? "";
  if (fallback && navigator.clipboard) {
    await navigator.clipboard.writeText(fallback);
    return true;
  }

  return false;
}
