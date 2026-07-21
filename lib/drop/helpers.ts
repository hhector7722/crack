import type { ContentType } from "./types";

export function sortDropsAsc<T extends { created_at: string }>(drops: T[]) {
  return [...drops].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export function formatRemaining(expiresAt: string, now: number) {
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return "Exp.";

  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.max(0, Math.floor((ms % 3_600_000) / 60_000));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function mimeFromExt(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    wav: "audio/wav",
    ogg: "audio/ogg",
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    zip: "application/zip",
    txt: "text/plain",
  };
  return map[ext] ?? "application/octet-stream";
}

export function contentTypeFromFile(file: File): ContentType {
  const mime = file.type || mimeFromExt(file.name);
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  return "file";
}

export function fileLabel(path: string) {
  return path.split("/").pop() ?? path;
}

const URL_IN_TEXT =
  /(https?:\/\/[^\s<]+[^\s<.,;:!?'")\]}>])/g;

export type TextPart = { type: "text" | "url"; value: string };

export function splitTextWithUrls(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let lastIndex = 0;
  const re = new RegExp(URL_IN_TEXT.source, "g");
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: "url", value: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return parts;
}

/** Primera URL del texto, si existe. */
export function firstUrlInText(text: string): string | null {
  const re = new RegExp(URL_IN_TEXT.source);
  const match = text.match(re);
  return match?.[1] ?? match?.[0] ?? null;
}

/** True si el mensaje es esencialmente solo una URL (con o sin espacios). */
export function isStandaloneUrl(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  const url = firstUrlInText(trimmed);
  if (!url) return false;
  return trimmed === url;
}

export function isImageFile(file: File) {
  return contentTypeFromFile(file) === "image";
}

export function isVideoFile(file: File) {
  return contentTypeFromFile(file) === "video";
}

export function isPreviewableMime(mime: string) {
  const m = mime.toLowerCase();
  return (
    m.startsWith("image/") ||
    m.startsWith("video/") ||
    m === "application/pdf" ||
    m === "text/plain"
  );
}

export function isPreviewableFile(file: File) {
  const mime = file.type || mimeFromExt(file.name);
  return isPreviewableMime(mime);
}

export function isFloatingAttachmentType(type: Exclude<ContentType, "text">) {
  return (
    type === "image" ||
    type === "video" ||
    type === "audio" ||
    type === "file"
  );
}

export function isPreviewablePath(path: string) {
  return isPreviewableMime(mimeFromExt(fileLabel(path)));
}

export function itemTypeFromContentType(
  type: Exclude<ContentType, "text">
): "image" | "video" | "audio" | "file" {
  if (type === "image") return "image";
  if (type === "video") return "video";
  if (type === "audio") return "audio";
  return "file";
}

export function storageFolderFromContentType(
  type: Exclude<ContentType, "text">
): "images" | "audio" | "files" {
  if (type === "image" || type === "video") return "images";
  if (type === "audio") return "audio";
  return "files";
}
