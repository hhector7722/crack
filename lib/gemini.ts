import { z } from "zod";
import type { ClassificationResult } from "./types";

const GEMINI_MODEL = "gemini-2.0-flash";

const classificationSchema = z.object({
  title: z.string(),
  type: z.enum(["note", "reminder", "important", "info"]),
  tags: z.array(z.string()),
  priority: z.enum(["high", "medium", "low"]),
  reminder_date: z.string().nullable(),
  summary: z.string(),
});

const SYSTEM_PROMPT = `Eres un clasificador de notas de voz en español. Analiza la transcripción y devuelve SOLO un objeto JSON válido (sin markdown, sin texto extra) con esta estructura exacta:
{
  "title": "string — título corto y descriptivo",
  "type": "note" | "reminder" | "important" | "info",
  "tags": ["string"],
  "priority": "high" | "medium" | "low",
  "reminder_date": "ISO8601 string o null si no hay fecha concreta",
  "summary": "string — resumen en una frase"
}

Reglas:
- type "reminder" si hay acción futura o fecha
- type "important" si es urgente o crítico
- type "info" si es informativo sin acción
- type "note" para notas generales
- tags en minúsculas, sin duplicados
- reminder_date solo si se menciona fecha/hora concreta, si no null`;

function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY no configurada");
  }
  return key;
}

async function geminiGenerate(
  parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }>,
  options?: { json?: boolean }
): Promise<string> {
  const apiKey = getGeminiApiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const body: Record<string, unknown> = {
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.2,
      ...(options?.json ? { responseMimeType: "application/json" } : {}),
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini error ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Respuesta vacía de Gemini");
  }

  return text;
}

export async function classifyWithGemini(
  transcript: string
): Promise<ClassificationResult> {
  const raw = await geminiGenerate(
    [
      { text: SYSTEM_PROMPT },
      { text: transcript },
    ],
    { json: true }
  );

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const retry = await geminiGenerate(
      [
        { text: SYSTEM_PROMPT },
        { text: `Devuelve SOLO JSON válido para: ${transcript}` },
      ],
      { json: true }
    );
    parsed = JSON.parse(retry);
  }

  return classificationSchema.parse(parsed);
}

export async function transcribeWithGemini(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const mimeType = file.type || "audio/webm";

  const text = await geminiGenerate([
    {
      inline_data: { mime_type: mimeType, data: base64 },
    },
    {
      text: "Transcribe este audio en español. Devuelve SOLO el texto transcrito, sin comentarios ni formato adicional.",
    },
  ]);

  return text.trim();
}
