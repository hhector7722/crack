"use client";

import { useState } from "react";
import { Link2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createItem, triggerEmbed } from "@/lib/items";

export function LinkCapture({
  onSaved,
  onError,
}: {
  onSaved: () => void;
  onError: (message: string) => void;
}) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveLink() {
    if (saving) return;

    let url: URL;
    try {
      const normalized = /^https?:\/\//i.test(value.trim())
        ? value.trim()
        : `https://${value.trim()}`;
      url = new URL(normalized);
    } catch {
      onError("Introduce una URL válida");
      return;
    }

    setSaving(true);
    onError("");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      let title = url.hostname.replace(/^www\./, "");
      let metadata = {};
      try {
        const response = await fetch(
          `/api/link-preview?url=${encodeURIComponent(url.toString())}`
        );
        if (response.ok) {
          const preview = await response.json();
          title = preview.title || title;
          metadata = {
            link_title: preview.title || undefined,
            link_image: preview.image || undefined,
            link_description: preview.description || undefined,
          };
        }
      } catch {
        // Guardar el enlace sigue siendo válido aunque falle su preview.
      }

      const item = await createItem(supabase, {
        type: "note",
        title,
        content: url.toString(),
        metadata,
        user_id: user.id,
      });
      triggerEmbed(item.id);
      onSaved();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Error guardando enlace");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="py-2">
      <label htmlFor="new-link" className="mb-2 block text-sm text-zinc-400">
        URL
      </label>
      <div className="flex min-h-12 items-center gap-3 border-b border-zinc-700">
        <Link2 className="h-5 w-5 shrink-0 text-zinc-500" />
        <input
          id="new-link"
          type="url"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          autoFocus
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void saveLink();
            }
          }}
          placeholder="https://…"
          className="h-12 min-w-0 flex-1 bg-transparent text-zinc-100 outline-none placeholder:text-zinc-600"
        />
      </div>
      <button
        type="button"
        onClick={() => void saveLink()}
        disabled={!value.trim() || saving}
        className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 font-semibold text-zinc-950 disabled:opacity-40"
      >
        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        {saving ? "Guardando…" : "Guardar enlace"}
      </button>
    </div>
  );
}
