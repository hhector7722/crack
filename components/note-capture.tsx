"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { createItem, updateItem } from "@/lib/items";

export interface NoteCaptureHandle {
  saveIfNeeded: () => Promise<boolean>;
  reset: () => void;
}

interface NoteCaptureProps {
  onSaved: () => void;
  onError: (msg: string) => void;
}

export const NoteCapture = forwardRef<NoteCaptureHandle, NoteCaptureProps>(
  function NoteCapture({ onSaved, onError }, ref) {
    const [content, setContent] = useState("");
    const [itemId, setItemId] = useState<string | null>(null);
    const savingRef = useRef(false);

    async function saveNote(notify = true): Promise<boolean> {
      if (savingRef.current || !content.trim()) return false;
      savingRef.current = true;

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("No autenticado");

        const title =
          content.trim().split("\n")[0].slice(0, 80) || "Nota sin título";

        if (itemId) {
          await updateItem(supabase, itemId, {
            title,
            content: content.trim(),
          });
        } else {
          const item = await createItem(supabase, {
            type: "note",
            title,
            content: content.trim(),
            user_id: user.id,
            metadata: {
              classification_type: "note",
              summary: content.trim().slice(0, 120),
            },
          });
          setItemId(item.id);
        }

        if (notify) onSaved();
        return true;
      } catch (err) {
        onError(err instanceof Error ? err.message : "Error guardando nota");
        return false;
      } finally {
        savingRef.current = false;
      }
    }

    useImperativeHandle(ref, () => ({
      saveIfNeeded: () => saveNote(false),
      reset: () => {
        setContent("");
        setItemId(null);
      },
    }));

    return (
      <div className="py-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe tu nota..."
          rows={8}
          autoFocus
          className="min-h-[200px] text-base"
        />
        <p className="mt-2 text-xs text-zinc-500">
          Se guardará automáticamente al cerrar
        </p>
        <button
          type="button"
          onClick={() => saveNote(true)}
          disabled={!content.trim()}
          className="mt-4 h-12 w-full rounded-xl bg-zinc-100 font-semibold text-zinc-950 disabled:opacity-50"
        >
          Guardar ahora
        </button>
      </div>
    );
  }
);
