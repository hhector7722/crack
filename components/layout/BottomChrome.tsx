"use client";

import { useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FileUp, Mic, Image, Home, FileText, Search, Zap } from "lucide-react";
import { PagerDots } from "@/components/layout/PagerDots";
import { useAppShell } from "@/components/app-shell-context";
import { useSearch } from "@/components/search-context";
import { useBumpRefresh } from "@/app/(app)/layout";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/storage";
import { createItem, triggerEmbed } from "@/lib/items";

export function BottomChrome() {
  const pathname = usePathname();
  const router = useRouter();
  const { navigateToPage } = useAppShell();
  const { toggleSearch } = useSearch();
  const bumpRefresh = useBumpRefresh();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (pathname === "/login" || pathname.startsWith("/auth")) {
    return null;
  }

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;

      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return;

      const ext = file.name.split(".").pop()?.toLowerCase() ?? "file";
      const path = await uploadFile(supabase, user.id, "files", file, ext);

      const item = await createItem(supabase, {
        type: "file",
        title: file.name.replace(/\.[^.]+$/, "") || "Archivo",
        file_url: path,
        user_id: user.id,
        metadata: {},
      });
      triggerEmbed(item.id);
      bumpRefresh();
    },
    [bumpRefresh]
  );

  return (
    <div
      data-tm-bottom-chrome
      className="tm-bottom-chrome pointer-events-none fixed bottom-0 left-0 right-0 z-[95] flex flex-col"
    >
      <div className="pointer-events-auto flex w-full items-center justify-around bg-[#1c1c1e] px-2 py-3 shadow-xl shadow-black/50">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Archivo"
          className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-300 transition-colors active:text-zinc-100 active:bg-zinc-800"
        >
          <FileUp className="h-5 w-5" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => navigateToPage(0)}
          aria-label="Audio"
          className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-300 transition-colors active:text-zinc-100 active:bg-zinc-800"
        >
          <Mic className="h-5 w-5" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => navigateToPage(1)}
          aria-label="Imagen"
          className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-300 transition-colors active:text-zinc-100 active:bg-zinc-800"
        >
          <Image className="h-5 w-5" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => navigateToPage(2)}
          aria-label="Inicio"
          className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-300 transition-colors active:text-zinc-100 active:bg-zinc-800"
        >
          <Home className="h-5 w-5" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => navigateToPage(4)}
          aria-label="Notas"
          className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-300 transition-colors active:text-zinc-100 active:bg-zinc-800"
        >
          <FileText className="h-5 w-5" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={toggleSearch}
          aria-label="Buscar"
          className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-300 transition-colors active:text-zinc-100 active:bg-zinc-800"
        >
          <Search className="h-5 w-5" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => router.push("/drop")}
          aria-label="Drop"
          className="flex h-11 w-11 items-center justify-center rounded-full text-amber-400 transition-colors active:text-amber-200 active:bg-zinc-800"
        >
          <Zap className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,audio/*,image/*,.pdf,.csv,.xls,.xlsx,.doc,.docx,.ppt,.pptx,.txt,.json"
        className="hidden"
        onChange={handleFileUpload}
      />

      <div className="relative top-3 z-10">
        <PagerDots />
      </div>
    </div>
  );
}
