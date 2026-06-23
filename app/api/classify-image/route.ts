import { NextResponse } from "next/server";
import { classifyImage } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
      { error: "Archivo demasiado grande (máx 10MB)" },
      { status: 400 }
    );
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: `Tipo no soportado: ${file.type}` },
      { status: 400 }
    );
  }

  try {
    const result = await classifyImage(file);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[classify-image]", err);
    return NextResponse.json(
      { error: "Error clasificando imagen" },
      { status: 502 }
    );
  }
}
