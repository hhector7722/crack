"use client";

import { useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Home, Mic, Image, FileText, FileUp, Search, Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppShell } from "@/components/app-shell-context";
import { useSearch } from "@/components/search-context";
import { useBumpRefresh } from "@/app/(app)/layout";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/storage";
import { createItem, triggerEmbed } from "@/lib/items";

type CrackNavItem = {
  name: string;
  icon: LucideIcon;
  action: "page" | "search" | "file" | "drop";
  pageIndex?: number;
};

const CRACK_NAV_ITEMS: CrackNavItem[] = [
  { name: "Archivo", icon: FileUp, action: "file" },
  { name: "Audio",   icon: Mic,    action: "page",  pageIndex: 0 },
  { name: "Imagen",  icon: Image,  action: "page",  pageIndex: 1 },
  { name: "Inicio",  icon: Home,   action: "page",  pageIndex: 2 },
  { name: "Notas",   icon: FileText, action: "page", pageIndex: 4 },
  { name: "Buscar",  icon: Search, action: "search" },
  { name: "Drop",    icon: Zap,    action: "drop" },
];

export function TabBar() {
  const router = useRouter();
  const { pagerIndex, navigateToPage } = useAppShell();
  const { toggleSearch } = useSearch();
  const bumpRefresh = useBumpRefresh();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function handleClick(item: CrackNavItem) {
    switch (item.action) {
      case "page":
        navigateToPage(item.pageIndex!);
        break;
      case "search":
        toggleSearch();
        break;
      case "file":
        fileInputRef.current?.click();
        break;
      case "drop":
        router.push("/drop");
        break;
    }
  }

  return (
    <nav
      className="tm-app-tabbar pointer-events-none flex h-[var(--tm-tabbar-core)] w-full shrink-0 items-center justify-around px-1 md:px-8"
      aria-label="Navegacion principal"
    >
      {CRACK_NAV_ITEMS.map((item) => {
        const isPage = item.action === "page";
        const active = isPage ? pagerIndex === item.pageIndex : false;
        const Icon = item.icon;

        return (
          <button
            key={item.name}
            type="button"
            className={cn(
              "pointer-events-auto flex min-h-12 min-w-0 flex-1 items-end justify-center pb-1",
              "transition-[color,transform,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95",
              active ? "text-[var(--tm-accent)]" : "text-[var(--tm-muted)]"
            )}
            aria-current={active ? "page" : undefined}
            aria-label={item.name}
            onClick={() => handleClick(item)}
          >
            <Icon size={20} className="md:h-5 md:w-5" strokeWidth={2} />
          </button>
        );
      })}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,audio/*,image/*,.pdf,.csv,.xls,.xlsx,.doc,.docx,.ppt,.pptx,.txt,.json"
        className="hidden"
        onChange={handleFileUpload}
      />
    </nav>
  );
}
