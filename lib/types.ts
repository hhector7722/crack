export type ItemType = "note" | "image" | "audio";
export type ClassificationType = "note" | "reminder" | "important" | "info";
export type Priority = "high" | "medium" | "low";
export type Theme = "Dev" | "Marbella" | "Sport" | "Politics" | "Fun" | "She" | "Other";

export interface ItemMetadata {
  themes?: Theme[];
  tags?: string[];
  priority?: Priority;
  reminder_date?: string | null;
  classification_type?: ClassificationType;
  summary?: string;
  raw_transcript?: string;
  duration_seconds?: number;
  link_image?: string;
  link_title?: string;
  link_description?: string;
}

export interface Item {
  id: string;
  type: ItemType;
  title: string | null;
  content: string | null;
  file_url: string | null;
  metadata: ItemMetadata;
  pinned: boolean;
  created_at: string;
  user_id: string;
}

export const THEME_LABELS: Record<Theme, string> = {
  Dev: "Dev",
  Marbella: "Marbella",
  Sport: "Sport",
  Politics: "Politics",
  Fun: "Fun",
  She: "She",
  Other: "Other",
};

export const THEME_COLORS: Record<Theme, string> = {
  Dev: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Marbella: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Sport: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  Politics: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Fun: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  She: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  Other: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
};

export function themeLabel(theme: Theme): string {
  return THEME_LABELS[theme] ?? theme;
}

export function themeColor(theme: Theme): string {
  return THEME_COLORS[theme] ?? "bg-zinc-500/20 text-zinc-300 border-zinc-500/30";
}

export interface ClassificationResult {
  title: string;
  type: ClassificationType;
  themes: Theme[];
  tags: string[];
  priority: Priority;
  reminder_date: string | null;
  summary: string;
  create_note_from_audio?: boolean;
}
