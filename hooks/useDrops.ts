"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/storage";
import type { Drop } from "@/lib/drop/types";
import { sortDropsAsc, contentTypeFromFile } from "@/lib/drop/helpers";

interface UseDropsOptions {
  initialDrops: Drop[];
  userId: string;
}

async function fetchAttachments(
  supabase: ReturnType<typeof createClient>,
  dropId: string
): Promise<Drop> {
  const { data, error } = await supabase
    .from("drops")
    .select("*, attachments:drop_attachments(*)")
    .eq("id", dropId)
    .single();

  if (error || !data) {
    console.warn("fetchAttachments falló", error);
    throw error ?? new Error("Drop no encontrado");
  }

  return data as unknown as Drop;
}

export function useDrops({ initialDrops, userId }: UseDropsOptions) {
  const [drops, setDrops] = useState<Drop[]>(() => sortDropsAsc(initialDrops));
  const [content, setContent] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [now, setNow] = useState(0);
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "connected" | "error">("connecting");

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // clock tick
  useEffect(() => {
    const update = () => setNow(Date.now());
    const t0 = window.setTimeout(update, 0);
    const t1 = window.setInterval(update, 60_000);
    return () => {
      window.clearTimeout(t0);
      window.clearInterval(t1);
    };
  }, []);

  // notification permission
  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "default")
      return;
    void Notification.requestPermission();
  }, []);

  const upsertDrop = useCallback((drop: Drop) => {
    setDrops((current) => {
      const without = current.filter((d) => d.id !== drop.id);
      return sortDropsAsc([drop, ...without]).filter(
        (d) => new Date(d.expires_at).getTime() > Date.now()
      );
    });
  }, []);

  // realtime
  useEffect(() => {
    const supabase = createClient();
    setRealtimeStatus("connecting");

    const channel = supabase
      .channel(`drops:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "drops",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const raw = { ...(payload.new as Drop), attachments: [] };
          upsertDrop(raw);

          fetchAttachments(supabase, raw.id)
            .then((full) => upsertDrop(full))
            .catch(() => {});

          if (
            document.hidden &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            const body = raw.content?.slice(0, 120) ?? "Nuevo Drop";
            new Notification("Nuevo Drop", { body });
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("connected");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setRealtimeStatus("error");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [upsertDrop, userId]);

  // auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [drops]);

  const visibleDrops = useMemo(
    () =>
      drops.filter(
        (d) => now === 0 || new Date(d.expires_at).getTime() > now
      ),
    [drops, now]
  );

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setContent(e.target.value);
      const el = e.target;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    },
    []
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files;
      if (fileList && fileList.length > 0) {
        const files: File[] = [];
        for (let i = 0; i < fileList.length; i++) {
          const file = fileList.item(i);
          if (file) files.push(file);
        }
        setPendingFiles((prev) => [...prev, ...files]);
      }
      e.target.value = "";
    },
    []
  );

  const removePendingFile = useCallback((index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if ((!trimmed && pendingFiles.length === 0) || sending) return;

    setSending(true);
    setError(null);

    try {
      if ("Notification" in window && Notification.permission === "default") {
        void Notification.requestPermission();
      }

      if (pendingFiles.length > 0) {
        const supabase = createClient();

        const attachments = await Promise.all(
          pendingFiles.map(async (file) => {
            const ct = contentTypeFromFile(file);
            const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
            const filePath = await uploadFile(supabase, userId, "drops", file, ext);
            return { file_url: filePath, content_type: ct };
          })
        );

        const { data, error: rpcError } = await supabase.rpc(
          "insert_drop_with_attachments",
          {
            p_content: trimmed || null,
            p_user_id: userId,
            p_attachments: attachments,
          }
        );

        if (rpcError) throw rpcError;

        upsertDrop(data as unknown as Drop);
        setPendingFiles([]);
      } else {
        const supabase = createClient();
        const { data, error: insertError } = await supabase
          .from("drops")
          .insert({
            content: trimmed,
            user_id: userId,
          })
          .select(
            "id, content, user_id, created_at, expires_at, attachments:drop_attachments(*)"
          )
          .single();

        if (insertError) throw insertError;
        upsertDrop(data as Drop);
      }

      setContent("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error enviando Drop");
    } finally {
      setSending(false);
    }
  }

  const canSend =
    (content.trim().length > 0 || pendingFiles.length > 0) && !sending;

  return {
    drops,
    visibleDrops,
    content,
    setContent,
    pendingFiles,
    setPendingFiles,
    error,
    sending,
    now,
    expandedImageUrl,
    setExpandedImageUrl,
    scrollRef,
    fileInputRef,
    textareaRef,
    canSend,
    realtimeStatus,
    handleTextareaChange,
    handleFileChange,
    removePendingFile,
    handleSend,
    upsertDrop,
  };
}
