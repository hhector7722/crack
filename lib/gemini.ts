import { z } from "zod";
import type { ClassificationResult } from "./types";

const DEFAULT_GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-3.5-flash",
  "gemini-2.5-flash-lite",
] as const;

const classificationSchema = z.object({
  title: z.string(),
  type: z.enum(["note", "reminder", "important", "info"]),
  tags: z.array(z.string()),
  themes: z.array(z.enum(["Dev", "Marbella", "Sport", "Politics", "Fun", "She", "Other"])),
  priority: z.enum(["high", "medium", "low"]),
  reminder_date: z.string().nullable(),
  summary: z.string(),
  create_note_from_audio: z.boolean().optional(),
});

const SYSTEM_PROMPT = `Eres un clasificador general de contenido en español. Analiza el texto proporcionado (que puede ser una nota, la transcripción de un audio o el contenido extraído de una imagen) y devuelve SOLO un objeto JSON válido (sin markdown, sin texto extra) con esta estructura exacta:
{
  "title": "string — título corto y descriptivo",
  "type": "note" | "reminder" | "important" | "info",
  "tags": ["string"],
  "themes": ["Dev" | "Marbella" | "Sport" | "Politics" | "Fun" | "She" | "Other"],
  "priority": "high" | "medium" | "low",
  "reminder_date": "ISO8601 string o null si no hay fecha concreta",
  "summary": "string — resumen en una frase",
  "create_note_from_audio": boolean
}

Reglas:
- type "reminder" si hay acción futura o fecha
- type "important" si es urgente o crítico
- type "info" si es informativo sin acción
- type "note" para notas generales
- tags en minúsculas, sin duplicados
- themes: elige una o varias de las siguientes temáticas:
    * "Dev": cosas relacionadas con el desarrollo, tecnología, software, IA.
    * "Marbella": de trabajo, relacionado con el "Bar la Marbella".
    * "Sport": relacionado con deportes.
    * "Politics": relacionado con la política.
    * "Fun": relacionado con ocio, variado, memes, cosas graciosas o de humor.
    * "She": relacionado con contenido sexual.
    * "Other": relacionado con temas que no estén relacionados con las temáticas anteriores.
- create_note_from_audio: true SOLO SI detectas una orden explícita para crear una nota, por ejemplo: "añádelo a notas", "anota esto", "apunta esto", "créame una nota". De lo contrario false.
- reminder_date solo si se menciona fecha/hora concreta, si no null`;

function getGeminiModels(): string[] {
  const configured = process.env.GEMINI_MODEL?.trim();
  if (configured) return [configured];
  return [...DEFAULT_GEMINI_MODELS];
}

function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY no configurada");
  }
  return key;
}

function isModelUnavailable(status: number, body: string): boolean {
  if (status === 404) return true;
  const lower = body.toLowerCase();
  return (
    lower.includes("no longer available") ||
    lower.includes("not found") ||
    lower.includes("not_found")
  );
}

async function geminiGenerateWithModel(
  model: string,
  parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }>,
  options?: { json?: boolean }
): Promise<string> {
  const apiKey = getGeminiApiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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

  const errText = res.ok ? "" : await res.text();

  if (!res.ok) {
    const err = new Error(`Gemini ${model} ${res.status}`) as Error & {
      status?: number;
      body?: string;
      modelUnavailable?: boolean;
    };
    err.status = res.status;
    err.body = errText;
    err.modelUnavailable = isModelUnavailable(res.status, errText);
    throw err;
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

async function geminiGenerate(
  parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }>,
  options?: { json?: boolean }
): Promise<string> {
  const models = getGeminiModels();
  let lastError: unknown;

  for (const model of models) {
    try {
      return await geminiGenerateWithModel(model, parts, options);
    } catch (err) {
      lastError = err;
      const modelUnavailable =
        err instanceof Error &&
        "modelUnavailable" in err &&
        (err as { modelUnavailable?: boolean }).modelUnavailable;

      if (modelUnavailable && models.indexOf(model) < models.length - 1) {
        console.warn(`[gemini] modelo ${model} no disponible, probando siguiente`);
        continue;
      }
      break;
    }
  }

  console.error("[gemini] error:", lastError);
  throw new Error("Error en servicio de IA");
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

export async function classifyImageWithGemini(
  file: File
): Promise<ClassificationResult> {
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const mimeType = file.type || "image/jpeg";

  const raw = await geminiGenerate(
    [
      { text: SYSTEM_PROMPT },
      { text: "Clasifica el contenido de la siguiente imagen según las reglas establecidas." },
      { inline_data: { mime_type: mimeType, data: base64 } },
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
        { text: "Devuelve SOLO JSON válido para la imagen." },
        { inline_data: { mime_type: mimeType, data: base64 } },
      ],
      { json: true }
    );
    parsed = JSON.parse(retry);
  }

  return classificationSchema.parse(parsed);
}
