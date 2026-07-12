"use client";

import { useState, useCallback } from "react";
import type { Drop } from "@/lib/drop/types";
import { useDrops } from "@/hooks/useDrops";
import { DropHeader } from "@/components/drop/DropHeader";
import { DropMessages } from "@/components/drop/DropMessages";
import { DropComposer } from "@/components/drop/DropComposer";
import { DropImageOverlay } from "@/components/drop/DropImageOverlay";

export type { Drop };

export function DropPage({
  initialDrops,
  userId,
  showHeader = true,
}: {
  initialDrops: Drop[];
  userId: string;
  showHeader?: boolean;
}) {
  const {
    visibleDrops,
    content, setContent,
    pendingFiles,
    setPendingFiles,
    error,
    sending,
    now,
    expandedImageUrl, setExpandedImageUrl,
    scrollRef,
    fileInputRef,
    textareaRef,
    canSend,
    realtimeStatus,
    handleFileChange,
    removePendingFile,
    handleSend,
  } = useDrops({ initialDrops, userId });

  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        setPendingFiles((prev) => [...prev, ...files]);
      }
    },
    [setPendingFiles]
  );

  return (
    <div
      className="fixed inset-0 flex flex-col bg-zinc-950 text-zinc-100"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {showHeader ? <DropHeader /> : null}

      <DropMessages
        drops={visibleDrops}
        now={now}
        onExpandImage={setExpandedImageUrl}
        scrollRef={scrollRef}
      />

      <DropComposer
        content={content}
        onContentChange={setContent}
        pendingFiles={pendingFiles}
        canSend={canSend}
        sending={sending}
        error={error}
        onSend={handleSend}
        onFileChange={handleFileChange}
        onRemovePendingFile={removePendingFile}
        onPasteFile={(file) => setPendingFiles((prev) => [...prev, file])}
        fileInputRef={fileInputRef}
        textareaRef={textareaRef}
      />

      {isDragOver ? (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-violet-900/20 backdrop-blur-sm">
          <div className="rounded-2xl border-2 border-dashed border-violet-400/50 bg-zinc-900/80 px-8 py-6 text-center">
            <p className="text-sm font-semibold text-violet-300">
              Suelta los archivos aquí
            </p>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none fixed bottom-2 right-2 flex items-center gap-1.5">
        <span
          className={`h-2 w-2 rounded-full ${
            realtimeStatus === "connected"
              ? "bg-emerald-500"
              : realtimeStatus === "error"
                ? "bg-red-500"
                : "bg-amber-500"
          }`}
        />
        <span className="text-[10px] text-zinc-600">
          {realtimeStatus === "connected"
            ? "live"
            : realtimeStatus === "error"
              ? "offline"
              : "connecting"}
        </span>
      </div>

      {expandedImageUrl ? (
        <DropImageOverlay
          path={expandedImageUrl}
          onClose={() => setExpandedImageUrl(null)}
        />
      ) : null}
    </div>
  );
}
