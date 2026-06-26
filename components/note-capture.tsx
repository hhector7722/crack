"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { createItem, updateItem, triggerEmbed } from "@/lib/items";

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
    const [isSaving, setIsSaving] = useState(false);
    const savingRef = useRef(false);

    async function saveNote(notify = true): Promise<boolean> {
      if (savingRef.current || !content.trim()) return false;
      savingRef.current = true;
      setIsSaving(true);

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("No autenticado");

        let title = content.trim().split("\n")[0].slice(0, 80) || "Nota sin título";
        let metadata: Record<string, unknown> = {
          classification_type: "note",
          summary: content.trim().slice(0, 120),
        };

        if (!itemId) {
          try {
            const classifyRes = await fetch("/api/classify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ transcript: content.trim() }),
            });
            if (classifyRes.ok) {
              const result = await classifyRes.json();
              if (result.title) title = result.title;
              metadata = {
                themes: result.themes || [],
                tags: result.tags || [],
                priority: result.priority,
                classification_type: result.type || "note",
                summary: result.summary || metadata.summary,
              };
            }
          } catch (e) {
            console.error("Error clasificando nota", e);
          }
        }

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
            metadata,
          });
          setItemId(item.id);
          triggerEmbed(item.id);
        }

        if (notify) onSaved();
        return true;
      } catch (err) {
        onError(err instanceof Error ? err.message : "Error guardando nota");
        return false;
      } finally {
        savingRef.current = false;
        setIsSaving(false);
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
          disabled={!content.trim() || isSaving}
          className="mt-4 h-12 w-full rounded-xl bg-zinc-100 font-semibold text-zinc-950 disabled:opacity-50"
        >
          {isSaving ? "Guardando y clasificando..." : "Guardar ahora"}
        </button>
      </div>
    );
  }
);
