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
