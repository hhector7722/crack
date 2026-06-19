import OpenAI from "openai";
import { z } from "zod";
import type { ClassificationResult } from "./types";

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

export function getOpenAIClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function classifyWithOpenAI(
  transcript: string
): Promise<ClassificationResult> {
  const openai = getOpenAIClient();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: transcript },
    ],
    temperature: 0.2,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("Respuesta vacía de OpenAI");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const retry = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Devuelve SOLO JSON válido para: ${transcript}`,
        },
      ],
      temperature: 0,
    });
    const retryRaw = retry.choices[0]?.message?.content;
    if (!retryRaw) throw new Error("JSON inválido de OpenAI");
    parsed = JSON.parse(retryRaw);
  }

  return classificationSchema.parse(parsed);
}

export async function transcribeWithOpenAI(file: File): Promise<string> {
  const openai = getOpenAIClient();
  const transcription = await openai.audio.transcriptions.create({
    model: "whisper-1",
    language: "es",
    file,
  });
  return transcription.text;
}
