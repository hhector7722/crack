import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transcribeAudio, classifyTranscript } from "@/lib/ai";
import type { Item, ItemMetadata } from "@/lib/types";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

function isAllowedAudioType(type: string): boolean {
  if (!type) return true;
  const base = type.split(";")[0].trim().toLowerCase();
  return (
    base.startsWith("audio/") ||
    base === "video/webm" ||
    base === "video/mp4" ||
    base === "application/octet-stream"
  );
}

async function updateItemMetadata(
  supabase: Awaited<ReturnType<typeof createClient>>,
  itemId: string,
  userId: string,
  updates: Partial<Item> & { metadata: ItemMetadata }
) {
  const { error } = await supabase
    .from("items")
    .update(updates)
    .eq("id", itemId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "FormData inválido" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Campo file requerido" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Archivo demasiado grande (máx 25MB)" },
      { status: 400 }
    );
  }

  if (file.type && !isAllowedAudioType(file.type)) {
    return NextResponse.json(
      { error: `Tipo no soportado: ${file.type}` },
      { status: 400 }
    );
  }

  const itemId = formData.get("item_id");
  const itemIdValue = typeof itemId === "string" && itemId ? itemId : null;
  let item: Item | null = null;

  if (itemIdValue) {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("id", itemIdValue)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Item no encontrado" }, { status: 404 });
    }
    item = data as Item;
  }

  try {
    const transcript = await transcribeAudio(file);

    if (itemIdValue && item) {
      const transcribedMetadata = {
        ...item.metadata,
        raw_transcript: transcript,
        summary: transcript.slice(0, 120),
        classification_status: "transcribed",
        classification_error: undefined,
      } satisfies ItemMetadata;

      await updateItemMetadata(supabase, itemIdValue, user.id, {
        title: transcript.trim().split("\n")[0].slice(0, 80) || item.title,
        content: transcript,
        metadata: transcribedMetadata,
      });

      try {
        const result = await classifyTranscript(transcript);
        await updateItemMetadata(supabase, itemIdValue, user.id, {
          title: result.title || item.title,
          content: transcript,
          metadata: {
            ...transcribedMetadata,
            themes: result.themes || [],
            tags: result.tags || [],
            priority: result.priority,
            reminder_date: result.reminder_date,
            classification_type: result.type,
            summary: result.summary,
            classification_status: "classified",
            classification_error: undefined,
          } satisfies ItemMetadata,
        });
      } catch (err) {
        console.error("[transcribe:classify]", err);
        await updateItemMetadata(supabase, itemIdValue, user.id, {
          title: transcript.trim().split("\n")[0].slice(0, 80) || item.title,
          content: transcript,
          metadata: {
            ...transcribedMetadata,
            classification_status: "failed",
            classification_error: "Error clasificando transcripción",
          } satisfies ItemMetadata,
        });
      }
    }

    return NextResponse.json({ transcript });
  } catch (err) {
    console.error("[transcribe]", err);
    if (itemIdValue && item) {
      await updateItemMetadata(supabase, itemIdValue, user.id, {
        title: item.title,
        content: item.content,
        metadata: {
          ...item.metadata,
          classification_status: "failed",
          classification_error: "Error transcribiendo audio",
        } satisfies ItemMetadata,
      });
    }
    return NextResponse.json(
      { error: "Error transcribiendo audio" },
      { status: 500 }
    );
  }
}
