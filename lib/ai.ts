import { classifyWithGemini, transcribeWithGemini, classifyImageWithGemini } from "./gemini";
import { classifyWithOpenAI, transcribeWithOpenAI } from "./openai";
import { isOpenAIQuotaError } from "./ai-errors";
import type { ClassificationResult } from "./types";

export async function classifyTranscript(
  transcript: string
): Promise<ClassificationResult> {
  try {
    return await classifyWithOpenAI(transcript);
  } catch (err) {
    if (!isOpenAIQuotaError(err)) throw err;
    return classifyWithGemini(transcript);
  }
}

export async function transcribeAudio(file: File): Promise<string> {
  try {
    return await transcribeWithOpenAI(file);
  } catch (err) {
    if (!isOpenAIQuotaError(err)) throw err;
    return transcribeWithGemini(file);
  }
}

export async function classifyImage(file: File): Promise<ClassificationResult> {
  return classifyImageWithGemini(file);
}
