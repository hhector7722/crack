"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic } from "lucide-react";

function supportedAudioMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const candidates = ios
    ? ["audio/mp4", "audio/aac", "audio/webm;codecs=opus", "audio/webm"]
    : ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

export function HoldToRecordButton({
  onSendAudio,
  onError,
  disabled,
}: {
  onSendAudio: (file: File) => Promise<boolean>;
  onError: (message: string) => void;
  disabled?: boolean;
}) {
  const [state, setState] = useState<"idle" | "starting" | "recording" | "sending">("idle");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const pointerRef = useRef<number | null>(null);
  const sessionRef = useRef(0);
  const stoppedSessionRef = useRef<number | null>(null);

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
  }

  useEffect(() => {
    return () => {
      sessionRef.current += 1;
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") recorder.stop();
      stopStream();
    };
  }, []);

  async function beginRecording(event: React.PointerEvent<HTMLButtonElement>) {
    if (disabled || pointerRef.current !== null || state !== "idle") return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerRef.current = event.pointerId;
    const session = sessionRef.current + 1;
    sessionRef.current = session;
    stoppedSessionRef.current = null;
    setState("starting");
    onError("");

    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        throw new Error("Este dispositivo no permite grabar audio desde el navegador");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (session !== sessionRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const mimeType = supportedAudioMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (chunkEvent) => {
        if (chunkEvent.data.size > 0) chunksRef.current.push(chunkEvent.data);
      };
      recorder.onstop = async () => {
        if (session !== sessionRef.current) {
          stopStream();
          return;
        }
        if (stoppedSessionRef.current === session) return;
        stoppedSessionRef.current = session;
        stopStream();
        recorderRef.current = null;
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || mimeType || "audio/webm",
        });
        chunksRef.current = [];
        if (blob.size === 0) {
          setState("idle");
          onError("La grabación quedó vacía. Mantén pulsado un poco más.");
          return;
        }
        setState("sending");
        const extension = blob.type.includes("mp4") || blob.type.includes("aac") ? "m4a" : "webm";
        await onSendAudio(
          new File([blob], `nota-de-voz-${Date.now()}.${extension}`, { type: blob.type })
        );
        setState("idle");
      };

      recorder.start(200);
      setState("recording");
      if (pointerRef.current !== event.pointerId) stopRecording();
    } catch (recordingError) {
      stopStream();
      recorderRef.current = null;
      pointerRef.current = null;
      setState("idle");
      const errorName = recordingError instanceof DOMException ? recordingError.name : "";
      if (errorName === "NotAllowedError" || errorName === "SecurityError") {
        onError("No se concedió permiso para usar el micrófono");
      } else if (errorName === "NotFoundError") {
        onError("No se encontró ningún micrófono disponible");
      } else {
        onError("No se pudo iniciar la grabación de audio");
      }
    }
  }

  function finishRecording(event: React.PointerEvent<HTMLButtonElement>) {
    if (pointerRef.current !== event.pointerId) return;
    event.preventDefault();
    pointerRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    stopRecording();
  }

  const active = state === "starting" || state === "recording";

  return (
    <button
      type="button"
      disabled={disabled || state === "sending"}
      onPointerDown={(event) => void beginRecording(event)}
      onPointerUp={finishRecording}
      onPointerCancel={finishRecording}
      onContextMenu={(event) => event.preventDefault()}
      aria-label={active ? "Grabando; suelta para enviar" : "Mantén pulsado para grabar"}
      aria-pressed={active}
      className={`flex h-11 w-11 shrink-0 touch-none items-center justify-center rounded-full transition-colors disabled:opacity-40 ${
        active ? "bg-red-600 text-white" : "text-zinc-400 active:bg-zinc-800"
      }`}
    >
      {state === "sending" || state === "starting" ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Mic className={`h-5 w-5 ${state === "recording" ? "animate-pulse" : ""}`} />
      )}
    </button>
  );
}
