import { clsx, type ClassValue } from "clsx";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { twMerge } from "tailwind-merge";
import type { ClassificationType, Priority } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelative(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: es });
}

export function displayValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "" || value === 0) {
    return " ";
  }
  return String(value);
}

export function classificationLabel(type: ClassificationType | undefined): string {
  switch (type) {
    case "reminder":
      return "Recordatorio";
    case "important":
      return "Importante";
    case "info":
      return "Info";
    case "note":
    default:
      return "Nota";
  }
}

export function classificationColor(type: ClassificationType | undefined): string {
  switch (type) {
    case "reminder":
      return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    case "important":
      return "bg-red-500/20 text-red-300 border-red-500/30";
    case "info":
      return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    case "note":
    default:
      return "bg-zinc-500/20 text-zinc-300 border-zinc-500/30";
  }
}

export function priorityLabel(priority: Priority | undefined): string {
  switch (priority) {
    case "high":
      return "Alta";
    case "medium":
      return "Media";
    case "low":
      return "Baja";
    default:
      return " ";
  }
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const URL_RE = /https?:\/\/[^\s<>"{}|\\^`[\]]+/i;

export function extractFirstUrl(text: string | null | undefined): string | null {
  if (!text) return null;
  const match = text.match(URL_RE);
  return match?.[0] ?? null;
}

export function getNoteUrl(item: { title: string | null; content: string | null }): string | null {
  return extractFirstUrl(item.content) ?? extractFirstUrl(item.title);
}
