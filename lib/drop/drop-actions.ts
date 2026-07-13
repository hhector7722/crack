import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createItem,
  triggerClassify,
  triggerEmbed,
  triggerTranscribeAudio,
} from "@/lib/items";
import type { SharePayload } from "@/lib/share";
import { sharePayload } from "@/lib/share";
import { deleteFile, duplicateStorageFile } from "@/lib/storage";
import {
  fileLabel,
  itemTypeFromContentType,
  storageFolderFromContentType,
} from "./helpers";
import type { Drop } from "./types";
import { downloadSignedFile, getOrFetchSignedUrl } from "./signed-url-cache";

export function getDropCopyText(drop: Drop): string {
  const text = drop.content?.trim() ?? "";
  if (text) return text;
  if (drop.attachments.length === 1) {
    return fileLabel(drop.attachments[0].file_url);
  }
  if (drop.attachments.length > 1) {
    return drop.attachments.map((a) => fileLabel(a.file_url)).join("\n");
  }
  return "";
}

export async function buildDropSharePayload(drop: Drop): Promise<SharePayload> {
  const text = drop.content?.trim();
  const firstAttachment = drop.attachments[0];

  if (firstAttachment) {
    const url = await getOrFetchSignedUrl(firstAttachment.file_url);
    return {
      title: text || fileLabel(firstAttachment.file_url),
      text: text || undefined,
      url,
    };
  }

  return {
    title: "Drop",
    text: text || "",
  };
}

export async function copyDrop(drop: Drop): Promise<void> {
  const value = getDropCopyText(drop);
  if (!value) return;

  if (drop.attachments.length === 1 && !drop.content?.trim()) {
    const url = await getOrFetchSignedUrl(drop.attachments[0].file_url);
    await navigator.clipboard.writeText(url);
    return;
  }

  await navigator.clipboard.writeText(value);
}

export async function shareDrop(drop: Drop): Promise<boolean> {
  const payload = await buildDropSharePayload(drop);
  return sharePayload(payload);
}

export async function saveDropToDevice(drop: Drop): Promise<void> {
  if (drop.attachments.length === 0) {
    const text = drop.content?.trim();
    if (text) {
      await navigator.clipboard.writeText(text);
    }
    return;
  }

  for (const attachment of drop.attachments) {
    await downloadSignedFile(attachment.file_url);
  }
}

export async function deleteDrop(
  supabase: SupabaseClient,
  drop: Drop
): Promise<void> {
  for (const attachment of drop.attachments) {
    try {
      await deleteFile(supabase, attachment.file_url);
    } catch {
      /* ignore missing files */
    }
  }

  const { error } = await supabase.from("drops").delete().eq("id", drop.id);
  if (error) {
    throw new Error(`Error eliminando Drop: ${error.message}`);
  }
}

export async function saveDropToCrack(
  supabase: SupabaseClient,
  userId: string,
  drop: Drop
): Promise<void> {
  const text = drop.content?.trim() ?? "";

  if (!text && drop.attachments.length === 0) {
    throw new Error("No hay contenido para guardar");
  }

  if (text) {
    const note = await createItem(supabase, {
      type: "note",
      title: text.slice(0, 80) || "Nota",
      content: text,
      user_id: userId,
      metadata: {},
    });
    triggerEmbed(note.id);
    if (text.length > 20) {
      triggerClassify(note.id, text);
    }
  }

  for (const attachment of drop.attachments) {
    const folder = storageFolderFromContentType(attachment.content_type);
    const newPath = await duplicateStorageFile(
      supabase,
      attachment.file_url,
      userId,
      folder
    );
    const itemType = itemTypeFromContentType(attachment.content_type);
    const title = fileLabel(attachment.file_url).replace(/\.[^.]+$/, "");

    const item = await createItem(supabase, {
      type: itemType,
      title,
      content: "",
      file_url: newPath,
      user_id: userId,
      metadata: {},
    });

    triggerEmbed(item.id);

    if (itemType === "audio") {
      const url = await getOrFetchSignedUrl(newPath);
      const blob = await (await fetch(url)).blob();
      triggerTranscribeAudio(item.id, blob);
    }
  }
}
