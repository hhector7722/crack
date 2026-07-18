"use client";

import { useState, useCallback } from "react";
import type { Drop, DropVideoViewerState } from "@/lib/drop/types";
import { useDrops } from "@/hooks/useDrops";
import { useDropActions } from "@/hooks/useDropActions";
import { DropHeader } from "@/components/drop/DropHeader";
import { DropInstallHint } from "@/components/drop/DropInstallHint";
import { DropMessages } from "@/components/drop/DropMessages";
import { DropComposer } from "@/components/drop/DropComposer";
import { DropImageOverlay } from "@/components/drop/DropImageOverlay";
import { DropVideoOverlay } from "@/components/drop/DropVideoOverlay";

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
    imageViewer, setImageViewer,
    scrollRef,
    fileInputRef,
    textareaRef,
    canSend,
    realtimeStatus,
    handleContentResize,
    handleFileChange,
    removePendingFile,
    handleSend,
    removeDrop,
  } = useDrops({ initialDrops, userId });

  const { openActions, sheet: actionSheet } = useDropActions({
    userId,
    onDeleted: removeDrop,
  });

  const [videoViewer, setVideoViewer] = useState<DropVideoViewerState | null>(
    null
  );
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
      data-drop-shell
      className="fixed inset-0 flex min-w-0 flex-col overflow-x-hidden bg-zinc-950 text-zinc-100"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {showHeader ? (
        <>
          <DropHeader />
          <DropInstallHint />
        </>
      ) : null}

      <DropMessages
        drops={visibleDrops}
        now={now}
        onExpandImage={(paths, index) => setImageViewer({ paths, index })}
        onExpandVideo={(paths, index) => setVideoViewer({ paths, index })}
        onOpenActions={openActions}
        onContentResize={handleContentResize}
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

      {imageViewer ? (
        <DropImageOverlay
          viewer={imageViewer}
          onIndexChange={(index) =>
            setImageViewer((current) =>
              current ? { ...current, index } : null
            )
          }
          onClose={() => setImageViewer(null)}
        />
      ) : null}

      {videoViewer ? (
        <DropVideoOverlay
          viewer={videoViewer}
          onIndexChange={(index) =>
            setVideoViewer((current) =>
              current ? { ...current, index } : null
            )
          }
          onClose={() => setVideoViewer(null)}
        />
      ) : null}

      {actionSheet}
    </div>
  );
}
