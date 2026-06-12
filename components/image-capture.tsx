"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { createItem } from "@/lib/items";
import { uploadFile } from "@/lib/storage";

interface ImageCaptureProps {
  onSaved: () => void;
  onError: (msg: string) => void;
}

export function ImageCapture({ onSaved, onError }: ImageCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
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

      await createItem(supabase, {
        type: "image",
        title: file.name.replace(/\.[^.]+$/, ""),
        file_url: path,
        user_id: user.id,
        metadata: {},
      });

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
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {preview ? (
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Vista previa"
            className="max-h-[300px] w-full object-cover"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex min-h-[160px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-700 bg-zinc-900 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300"
        >
          <Camera className="h-10 w-10" />
          <span className="text-sm font-medium">Abrir cámara o galería</span>
        </button>
      )}

      {file && (
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setFile(null);
              setPreview(null);
              if (inputRef.current) inputRef.current.value = "";
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
                Guardar
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
