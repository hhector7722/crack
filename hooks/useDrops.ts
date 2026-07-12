"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/storage";
import type { Drop, DropImageViewerState } from "@/lib/drop/types";
import { sortDropsAsc, contentTypeFromFile } from "@/lib/drop/helpers";

/** Logs temporales de diagnóstico Realtime — eliminar cuando Drop esté estable. */
const DROP_RT_LOG = process.env.NODE_ENV !== "production";

function rtLog(...args: unknown[]) {
  if (DROP_RT_LOG) {
    console.log("[Drop RT]", new Date().toISOString(), ...args);
  }
}

const RESUBSCRIBE_DELAYS_MS = [1_000, 2_000, 5_000, 10_000] as const;

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
  const [imageViewer, setImageViewer] = useState<DropImageViewerState | null>(
    null
  );
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "connected" | "error">("connecting");

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pinnedToBottomRef = useRef(true);
  const forceScrollRef = useRef(false);
  const suppressScrollTrackingRef = useRef(false);

  const SCROLL_THRESHOLD_PX = 80;

  const isNearBottom = useCallback((el: HTMLElement) => {
    return (
      el.scrollHeight - el.scrollTop - el.clientHeight <= SCROLL_THRESHOLD_PX
    );
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    suppressScrollTrackingRef.current = true;
    pinnedToBottomRef.current = true;

    const snap = () => {
      el.scrollTop = el.scrollHeight;
    };

    snap();
    requestAnimationFrame(() => {
      snap();
      requestAnimationFrame(() => {
        snap();
        window.setTimeout(() => {
          suppressScrollTrackingRef.current = false;
          pinnedToBottomRef.current = isNearBottom(el);
        }, 50);
      });
    });
  }, [isNearBottom]);

  const handleContentResize = useCallback(() => {
    if (pinnedToBottomRef.current) {
      scrollToBottom();
    }
  }, [scrollToBottom]);

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
    let channel: RealtimeChannel | null = null;
    let resubscribeAttempt = 0;
    let resubscribeTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const clearResubscribeTimer = () => {
      if (resubscribeTimer) {
        clearTimeout(resubscribeTimer);
        resubscribeTimer = null;
      }
    };

    const scheduleResubscribe = (reason: string) => {
      if (disposed) return;
      clearResubscribeTimer();
      const delay =
        RESUBSCRIBE_DELAYS_MS[
          Math.min(resubscribeAttempt, RESUBSCRIBE_DELAYS_MS.length - 1)
        ];
      resubscribeAttempt += 1;
      rtLog("resubscribe programado", {
        reason,
        delay,
        attempt: resubscribeAttempt,
        socketConnected: supabase.realtime.isConnected(),
      });
      resubscribeTimer = setTimeout(() => {
        resubscribeTimer = null;
        void subscribeChannel(`retry:${reason}`);
      }, delay);
    };

    const subscribeChannel = async (trigger: string) => {
      if (disposed) return;

      clearResubscribeTimer();
      setRealtimeStatus("connecting");

      if (channel) {
        rtLog("eliminando canal previo", { trigger, topic: channel.topic });
        await supabase.removeChannel(channel);
        channel = null;
      }

      const topic = `drops:${userId}`;
      rtLog("suscribiendo canal", {
        trigger,
        topic,
        socketConnected: supabase.realtime.isConnected(),
        visibility: document.visibilityState,
      });

      if (!supabase.realtime.isConnected()) {
        rtLog("socket desconectado → connect()");
        supabase.realtime.connect();
      }

      channel = supabase
        .channel(topic)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "drops",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            rtLog("INSERT recibido", {
              id: (payload.new as Drop).id,
              socketConnected: supabase.realtime.isConnected(),
            });
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
        .subscribe((status, err) => {
          rtLog("estado canal", status, {
            error: err?.message,
            topic,
            socketConnected: supabase.realtime.isConnected(),
            visibility: document.visibilityState,
          });

          if (status === "SUBSCRIBED") {
            resubscribeAttempt = 0;
            setRealtimeStatus("connected");
            return;
          }

          if (
            status === "CLOSED" ||
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT"
          ) {
            setRealtimeStatus("error");
            scheduleResubscribe(status);
          }
        });
    };

    const onVisibilityChange = () => {
      rtLog("visibilitychange", {
        state: document.visibilityState,
        socketConnected: supabase.realtime.isConnected(),
        channelTopic: channel?.topic,
      });

      if (document.visibilityState !== "visible" || disposed) return;

      if (!supabase.realtime.isConnected()) {
        rtLog("pestaña visible + socket caído → connect()");
        supabase.realtime.connect();
      }

      // Canal muerto pero socket vivo: re-suscribir.
      if (channel && channel.state !== "joined") {
        rtLog("pestaña visible + canal no joined → resubscribe", {
          channelState: channel.state,
        });
        scheduleResubscribe("visibility");
      }
    };

    void subscribeChannel("mount");
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      disposed = true;
      clearResubscribeTimer();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (channel) {
        rtLog("cleanup → removeChannel", { topic: channel.topic });
        void supabase.removeChannel(channel);
      }
    };
  }, [upsertDrop, userId]);

  // auto-scroll: estilo WhatsApp/Telegram
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      if (suppressScrollTrackingRef.current) return;
      pinnedToBottomRef.current = isNearBottom(el);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [isNearBottom]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const content = el.firstElementChild;
    if (!content) return;

    const ro = new ResizeObserver(() => {
      handleContentResize();
    });
    ro.observe(content);
    return () => ro.disconnect();
  }, [handleContentResize, drops.length]);

  const visibleDrops = useMemo(
    () =>
      drops.filter(
        (d) => now === 0 || new Date(d.expires_at).getTime() > now
      ),
    [drops, now]
  );

  useEffect(() => {
    const force = forceScrollRef.current;
    forceScrollRef.current = false;
    if (force || pinnedToBottomRef.current) {
      scrollToBottom();
    }
  }, [visibleDrops, scrollToBottom]);

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

    forceScrollRef.current = true;
    pinnedToBottomRef.current = true;
    scrollToBottom();

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
    imageViewer,
    setImageViewer,
    scrollRef,
    fileInputRef,
    textareaRef,
    canSend,
    realtimeStatus,
    handleContentResize,
    handleTextareaChange,
    handleFileChange,
    removePendingFile,
    handleSend,
    upsertDrop,
  };
}
