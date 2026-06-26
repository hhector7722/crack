"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { createItem, triggerEmbed } from "@/lib/items";
import { uploadFile } from "@/lib/storage";

interface ImageCaptureProps {
  onSaved: () => void;
  onError: (msg: string) => void;
}

export function ImageCapture({ onSaved, onError }: ImageCaptureProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = await uploadFile(supabase, user.id, "images", file, ext);

      let metadata: Record<string, unknown> = {};
      let title = file.name.replace(/\.[^.]+$/, "");

      try {
        const formData = new FormData();
        formData.append("file", file);
        const classifyRes = await fetch("/api/classify-image", {
          method: "POST",
          body: formData,
        });
        if (classifyRes.ok) {
          const result = await classifyRes.json();
          if (result.title) title = result.title;
          metadata = {
            themes: result.themes || [],
            tags: result.tags || [],
            classification_type: result.type,
            summary: result.summary,
          };
        }
      } catch (e) {
        console.error("Error clasificando imagen", e);
      }

      const imgItem = await createItem(supabase, {
        type: "image",
        title,
        file_url: path,
        user_id: user.id,
        metadata,
      });
      triggerEmbed(imgItem.id);

      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error subiendo imagen");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4 py-2">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {preview ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={preview}
          alt="Vista previa"
          className="max-w-full max-h-[300px] rounded-xl"
        />
      ) : (
        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="action-ghost min-h-14 flex items-center justify-center gap-3"
          >
            <Camera className="h-5 w-5" />
            <span className="text-sm font-medium">Cámara</span>
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="action-ghost min-h-14 flex items-center justify-center gap-3"
          >
            <Upload className="h-5 w-5" />
            <span className="text-sm font-medium">Galería</span>
          </button>
        </div>
      )}

      {file && (
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setFile(null);
              setPreview(null);
              if (cameraInputRef.current) cameraInputRef.current.value = "";
              if (galleryInputRef.current) galleryInputRef.current.value = "";
            }}
            className="flex-1"
          >
            Cambiar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="flex-1"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? "Guardando y clasificando..." : "Guardar"}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
