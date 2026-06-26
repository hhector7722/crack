import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateItemEmbedding, saveEmbedding } from "@/lib/embedding";

const bodySchema = z.object({
  item_id: z.string().uuid(),
});

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
    return NextResponse.json({ error: "item_id requerido" }, { status: 400 });
  }

  const { item_id } = parsed.data;

  const { data: item, error: fetchError } = await supabase
    .from("items")
    .select("id, type, title, content, metadata, user_id")
    .eq("id", item_id)
    .single();

  if (fetchError || !item) {
    return NextResponse.json({ error: "Item no encontrado" }, { status: 404 });
  }

  if (item.user_id !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const embedding = await generateItemEmbedding(item);
    await saveEmbedding(supabase, item_id, embedding);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[embed]", err);
    return NextResponse.json(
      { error: "Error generando embedding" },
      { status: 500 }
    );
  }
}
