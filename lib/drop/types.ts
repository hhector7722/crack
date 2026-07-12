export type ContentType = "text" | "image" | "audio" | "video" | "file";

export type DropAttachment = {
  id: string;
  drop_id: string;
  file_url: string;
  content_type: Exclude<ContentType, "text">;
  created_at: string;
};

export type Drop = {
  id: string;
  content: string | null;
  user_id: string;
  created_at: string;
  expires_at: string;
  attachments: DropAttachment[];
};
