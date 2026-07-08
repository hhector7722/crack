"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createItem, triggerEmbed, triggerTranscribeAudio } from "@/lib/items";
import { uploadFile } from "@/lib/storage";
import { formatDuration } from "@/lib/utils";

interface VoiceRecorderProps {
  onSaved: () => void;
  onError: (msg: string) => void;
}

type Step = "idle" | "recording" | "processing";

function getSupportedMimeType(): string {
  const isIOS =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);

  const types = isIOS
    ? ["audio/mp4", "audio/aac", "audio/webm", "audio/webm;codecs=opus"]
    : [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/aac",
        "audio/ogg;codecs=opus",
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
  const [saving, setSaving] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
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
        void processRecording(blob);
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
    if (saving) return;
    setSaving(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const mime = blob.type || "audio/webm";
      const ext = mime.includes("mp4") || mime.includes("aac") ? "m4a" : "webm";
      const path = await uploadFile(supabase, user.id, "audio", blob, ext);

      const item = await createItem(supabase, {
        type: "audio",
        title: "Audio sin transcribir",
        content: "",
        file_url: path,
        user_id: user.id,
        metadata: {
          duration_seconds: duration,
          classification_status: "pending",
        },
      });

      triggerEmbed(item.id);
      triggerTranscribeAudio(item.id, blob);
      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error guardando audio");
      setStep("idle");
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

  return (
    <div className="flex flex-col items-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      <p className="mt-4 text-sm text-zinc-400">Guardando audio...</p>
    </div>
  );
}
