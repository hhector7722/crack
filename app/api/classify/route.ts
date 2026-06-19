import { NextResponse } from "next/server";
import { z } from "zod";
import { classifyTranscript } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  transcript: z.string().min(1),
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
    return NextResponse.json(
      { error: "transcript requerido" },
      { status: 400 }
    );
  }

  try {
    const result = await classifyTranscript(parsed.data.transcript);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[classify]", err);
    return NextResponse.json(
      { error: "Error clasificando transcripción" },
      { status: 502 }
    );
  }
}
