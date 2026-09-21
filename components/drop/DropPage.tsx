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
import { DropMediaComposer } from "@/components/drop/DropMediaComposer";
import { VisualViewportSync } from "@/components/layout/VisualViewportSync";

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
    textareaRef,
    canSend,
    realtimeStatus,
    refreshing,
    refreshDrops,
    handleContentResize,
    removePendingFile,
    handleSend,
    sendDrop,
    reportError,
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
  const [mediaFiles, setMediaFiles] = useState<File[] | null>(null);

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
    <>
      <VisualViewportSync />
      <div
      data-drop-shell
      className="fixed inset-x-0 top-[var(--tm-vv-offset-top,0px)] flex h-[var(--tm-vv-height,100dvh)] min-w-0 flex-col overflow-x-hidden bg-zinc-950 text-zinc-100"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {showHeader ? (
        <>
          <DropHeader refreshing={refreshing} onRefresh={refreshDrops} />
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
        onAddPendingFiles={(files) => setPendingFiles((current) => [...current, ...files])}
        onGallerySelected={(files) => setMediaFiles(files)}
        onSendAudio={(file) => sendDrop({ files: [file] })}
        onRecordingError={reportError}
        onRemovePendingFile={removePendingFile}
        onPasteFile={(file) => setPendingFiles((prev) => [...prev, file])}
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

      <div className="pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] right-2 flex items-center gap-1.5">
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

      {mediaFiles ? (
        <DropMediaComposer
          files={mediaFiles}
          sending={sending}
          onFilesChange={setMediaFiles}
          onClose={() => {
            if (!sending) setMediaFiles(null);
          }}
          onSend={async (comment, files) => {
            const sent = await sendDrop({ content: comment, files });
            if (sent) setMediaFiles(null);
            return sent;
          }}
        />
      ) : null}
    </>
  );
}
