"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { createItem } from "@/lib/items";
import { uploadFile } from "@/lib/storage";
import {
  classificationColor,
  classificationLabel,
  formatDuration,
  cn,
} from "@/lib/utils";
import type { ClassificationResult } from "@/lib/types";

interface VoiceRecorderProps {
  onSaved: () => void;
  onError: (msg: string) => void;
}

type Step = "idle" | "recording" | "processing" | "preview";

function getSupportedMimeType(): string {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/aac",
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

export function VoiceRecorder({ onSaved, onError }: VoiceRecorderProps) {
  const [step, setStep] = useState<Step>("idle");
  const [duration, setDuration] = useState(0);
  const [amplitude, setAmplitude] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [classification, setClassification] = useState<ClassificationResult | null>(null);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const startAmplitudeLoop = useCallback(() => {
    const tick = () => {
      const analyser = analyserRef.current;
      if (!analyser) return;
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      setAmplitude(avg / 255);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm",
        });
        audioBlobRef.current = blob;
        processRecording(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setStep("recording");
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);

      startAmplitudeLoop();
    } catch {
      onError("No se pudo acceder al micrófono");
    }
  }

  function stopRecording() {
    cleanup();
    mediaRecorderRef.current?.stop();
    setStep("processing");
  }

  async function processRecording(blob: Blob) {
    try {
      const ext = blob.type.includes("mp4") ? "m4a" : "webm";
      const formData = new FormData();
      formData.append("file", blob, `recording.${ext}`);

      const transcribeRes = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!transcribeRes.ok) {
        const err = await transcribeRes.json();
        throw new Error(err.error ?? "Error transcribiendo");
      }

      const { transcript: text } = await transcribeRes.json();
      setTranscript(text);

      const classifyRes = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text }),
      });

      if (!classifyRes.ok) {
        const err = await classifyRes.json();
        throw new Error(err.error ?? "Error clasificando");
      }

      const result: ClassificationResult = await classifyRes.json();
      setClassification(result);
      setTitle(result.title);
      setTags(result.tags.join(", "));
      setStep("preview");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error procesando audio");
      setStep("idle");
    }
  }

  async function handleSave() {
    if (!audioBlobRef.current || !classification) return;
    setSaving(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const ext = audioBlobRef.current.type.includes("mp4") ? "m4a" : "webm";
      const path = await uploadFile(
        supabase,
        user.id,
        "audio",
        audioBlobRef.current,
        ext
      );

      await createItem(supabase, {
        type: "audio",
        title,
        content: transcript,
        file_url: path,
        user_id: user.id,
        metadata: {
          tags: tags
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean),
          priority: classification.priority,
          reminder_date: classification.reminder_date,
          classification_type: classification.type,
          summary: classification.summary,
          raw_transcript: transcript,
          duration_seconds: duration,
        },
      });

      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error guardando");
    } finally {
      setSaving(false);
    }
  }

  if (step === "idle") {
    return (
      <div className="flex flex-col items-center py-8">
        <button
          type="button"
          onClick={startRecording}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition-transform active:scale-95"
        >
          <Mic className="h-9 w-9" />
        </button>
        <p className="mt-4 text-sm text-zinc-400">Pulsa para grabar</p>
      </div>
    );
  }

  if (step === "recording") {
    return (
      <div className="flex flex-col items-center py-6">
        <div className="mb-4 font-mono text-2xl text-zinc-100">
          {formatDuration(duration)}
        </div>
        <div className="mb-6 flex h-16 w-full items-end justify-center gap-1 px-4">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 rounded-full bg-red-500 transition-all duration-75"
              style={{
                height: `${Math.max(8, amplitude * 64 * (0.5 + (i % 5) * 0.1))}px`,
              }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={stopRecording}
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-500 bg-red-500/10 text-red-400"
        >
          <Square className="h-6 w-6 fill-current" />
        </button>
        <p className="mt-3 text-sm text-zinc-500">Pulsa para parar</p>
      </div>
    );
  }

  if (step === "processing") {
    return (
      <div className="flex flex-col items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        <p className="mt-4 text-sm text-zinc-400">
          Transcribiendo y clasificando...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2">
      {classification && (
        <Badge className={cn(classificationColor(classification.type))}>
          {classificationLabel(classification.type)}
        </Badge>
      )}

      <div>
        <label className="mb-1 block text-sm text-zinc-400">Título</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-zinc-100 focus:border-zinc-600 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-zinc-400">Tags</label>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="separados por coma"
          className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-zinc-100 focus:border-zinc-600 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-zinc-400">Transcripción</label>
        <Textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={4}
        />
      </div>

      <Button
        onClick={handleSave}
        disabled={saving || !title.trim()}
        className="w-full"
      >
        {saving ? "Guardando..." : "Guardar"}
      </Button>
    </div>
  );
}
