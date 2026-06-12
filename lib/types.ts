export type ItemType = "note" | "image" | "audio";
export type ClassificationType = "note" | "reminder" | "important" | "info";
export type Priority = "high" | "medium" | "low";

export interface ItemMetadata {
  tags?: string[];
  priority?: Priority;
  reminder_date?: string | null;
  classification_type?: ClassificationType;
  summary?: string;
  raw_transcript?: string;
  duration_seconds?: number;
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

export interface ClassificationResult {
  title: string;
  type: ClassificationType;
  tags: string[];
  priority: Priority;
  reminder_date: string | null;
  summary: string;
}
