import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transcribeAudio } from "@/lib/ai";

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

  try {
    const transcript = await transcribeAudio(file);
    return NextResponse.json({ transcript });
  } catch (err) {
    console.error("[transcribe]", err);
    return NextResponse.json(
      { error: "Error transcribiendo audio" },
      { status: 500 }
    );
  }
}
