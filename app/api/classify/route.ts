import { NextResponse } from "next/server";
import { z } from "zod";
import { classifyTranscript } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import type { Item, ItemMetadata } from "@/lib/types";

const bodySchema = z.object({
  transcript: z.string().min(1),
  item_id: z.string().uuid().optional(),
});

async function markClassificationFailed(
  supabase: Awaited<ReturnType<typeof createClient>>,
  itemId: string,
  userId: string,
  message: string
) {
  const { data: item } = await supabase
    .from("items")
    .select("metadata")
    .eq("id", itemId)
    .eq("user_id", userId)
    .single<Item>();

  await supabase
    .from("items")
    .update({
      metadata: {
        ...(item?.metadata ?? {}),
        classification_status: "failed",
        classification_error: message,
      } satisfies ItemMetadata,
    })
    .eq("id", itemId)
    .eq("user_id", userId);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "transcript requerido" },
      { status: 400 }
    );
  }

  try {
    const result = await classifyTranscript(parsed.data.transcript);

    if (parsed.data.item_id) {
      const { data: item, error: fetchError } = await supabase
        .from("items")
        .select("*")
        .eq("id", parsed.data.item_id)
        .eq("user_id", user.id)
        .single<Item>();

      if (fetchError || !item) {
        return NextResponse.json({ error: "Item no encontrado" }, { status: 404 });
      }

      const { error: updateError } = await supabase
        .from("items")
        .update({
          title: result.title || item.title,
          metadata: {
            ...item.metadata,
            themes: result.themes || [],
            tags: result.tags || [],
            priority: result.priority,
            reminder_date: result.reminder_date,
            classification_type: result.type,
            summary: result.summary,
            classification_status: "classified",
            classification_error: undefined,
          } satisfies ItemMetadata,
        })
        .eq("id", item.id)
        .eq("user_id", user.id);

      if (updateError) {
        throw new Error(updateError.message);
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[classify]", err);
    if (parsed.data.item_id) {
      await markClassificationFailed(
        supabase,
        parsed.data.item_id,
        user.id,
        "Error clasificando transcripción"
      );
    }
    return NextResponse.json(
      { error: "Error clasificando transcripción" },
      { status: 502 }
    );
  }
}
