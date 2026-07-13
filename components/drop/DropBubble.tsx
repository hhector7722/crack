"use client";

import { useState } from "react";
import { Check, Copy, Download, Loader2 } from "lucide-react";
import type { Drop, DropAttachment } from "@/lib/drop/types";
import { formatRemaining } from "@/lib/drop/helpers";
import {
  downloadSignedFile,
  getOrFetchSignedUrl,
} from "@/lib/drop/signed-url-cache";
import { DropTextContent } from "./DropTextContent";
import { BubbleImage } from "./bubbles/BubbleImage";
import { BubbleAudio } from "./bubbles/BubbleAudio";
import { BubbleVideo } from "./bubbles/BubbleVideo";
import { BubbleFile } from "./bubbles/BubbleFile";

function AttachmentRenderer({
  attachment,
  onContentResize,
}: {
  attachment: DropAttachment;
  onContentResize?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      const url = await getOrFetchSignedUrl(attachment.file_url);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  switch (attachment.content_type) {
    case "audio":
      return <BubbleAudio path={attachment.file_url} />;
    case "video":
      return <BubbleVideo path={attachment.file_url} onLoad={onContentResize} />;
    case "file":
      return <BubbleFile path={attachment.file_url} onCopy={handleCopy} copied={copied} />;
    default:
      return null;
  }
}

export function DropBubble({
  drop,
  now,
  onExpandImage,
  onContentResize,
}: {
  drop: Drop;
  now: number;
  onExpandImage: (paths: string[], index: number) => void;
  onContentResize?: () => void;
}) {
  const [copiedText, setCopiedText] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const { attachments, content } = drop;

  const imageAttachments = attachments.filter((a) => a.content_type === "image");
  const otherAttachments = attachments.filter((a) => a.content_type !== "image");
  const imagePaths = imageAttachments.map((a) => a.file_url);
  const hasCardContent = Boolean(content?.trim()) || otherAttachments.length > 0;

  async function copyText() {
    const value = content?.trim() ?? "";
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedText(true);
      window.setTimeout(() => setCopiedText(false), 1600);
    } catch {
      /* ignore */
    }
  }

  async function downloadAllImages() {
    if (imagePaths.length === 0 || downloadingAll) return;
    setDownloadingAll(true);
    try {
      for (const path of imagePaths) {
        await downloadSignedFile(path);
      }
    } catch {
      /* ignore */
    } finally {
      setDownloadingAll(false);
    }
  }

  const remainingLabel =
    now === 0 ? "--" : formatRemaining(drop.expires_at, now);

  return (
    <div className="flex justify-end">
      <div className="relative flex max-w-[80%] flex-col items-end gap-1.5">
        {hasCardContent ? (
          <div className="rounded-2xl rounded-br-sm bg-[#1c1c1e] px-3.5 py-2.5">
            {content?.trim() ? <DropTextContent content={content} /> : null}

            {otherAttachments.length > 0 ? (
              <div className={content?.trim() ? "mt-2 flex flex-col gap-2" : "flex flex-col gap-2"}>
                {otherAttachments.map((a) => (
                  <AttachmentRenderer
                    key={a.id}
                    attachment={a}
                    onContentResize={onContentResize}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {imageAttachments.length > 0 ? (
          <div className="flex max-w-full flex-wrap justify-end gap-1.5">
            {imageAttachments.map((a) => (
              <BubbleImage
                key={a.id}
                path={a.file_url}
                onLoad={onContentResize}
                onExpand={() =>
                  onExpandImage(imagePaths, imagePaths.indexOf(a.file_url))
                }
                onDownload={() => downloadSignedFile(a.file_url)}
              />
            ))}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-2 px-1">
          <span className="font-mono text-[10px] text-zinc-500">
            {remainingLabel}
          </span>

          {imageAttachments.length > 1 ? (
            <button
              type="button"
              onClick={() => void downloadAllImages()}
              disabled={downloadingAll}
              aria-label="Guardar imágenes"
              className="flex h-5 w-5 items-center justify-center rounded text-zinc-500 transition-colors hover:text-zinc-300 disabled:opacity-50"
            >
              {downloadingAll ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
            </button>
          ) : null}

          {content?.trim() ? (
            <button
              type="button"
              onClick={copyText}
              aria-label="Copiar texto"
              className="flex h-5 w-5 items-center justify-center rounded text-zinc-500 transition-colors hover:text-zinc-300"
            >
              {copiedText ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
