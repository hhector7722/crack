import OpenAI from "openai";
import { z } from "zod";
import type { ClassificationResult } from "./types";

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
