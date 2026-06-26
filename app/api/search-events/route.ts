import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  query: z.string().min(1).max(200),
  item_id: z.string().uuid().optional(),
  position: z.number().int().positive().optional(),
  clicked: z.boolean().default(false),
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
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { error } = await supabase.from("search_events").insert({
    user_id: user.id,
    query: parsed.data.query,
    item_id: parsed.data.item_id ?? null,
    position: parsed.data.position ?? null,
    clicked: parsed.data.clicked,
  });

  if (error) {
    console.error("[search-events]", error);
  }

  return NextResponse.json({ success: true });
}
