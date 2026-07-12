"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { Drop, DropAttachment } from "@/lib/drop/types";
import { formatRemaining } from "@/lib/drop/helpers";
import { getOrFetchSignedUrl } from "@/lib/drop/signed-url-cache";
import { BubbleImage } from "./bubbles/BubbleImage";
import { BubbleAudio } from "./bubbles/BubbleAudio";
import { BubbleVideo } from "./bubbles/BubbleVideo";
import { BubbleFile } from "./bubbles/BubbleFile";

function AttachmentRenderer({
  attachment,
  onExpandImage,
}: {
  attachment: DropAttachment;
  onExpandImage: (path: string) => void;
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
    case "image":
      return (
        <button type="button" onClick={() => onExpandImage(attachment.file_url)} className="block">
          <BubbleImage path={attachment.file_url} />
        </button>
      );
    case "audio":
      return <BubbleAudio path={attachment.file_url} />;
    case "video":
      return <BubbleVideo path={attachment.file_url} />;
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
}: {
  drop: Drop;
  now: number;
  onExpandImage: (path: string) => void;
}) {
  const [copiedText, setCopiedText] = useState(false);
  const { attachments, content } = drop;

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

  const remainingLabel =
    now === 0 ? "--" : formatRemaining(drop.expires_at, now);

  return (
    <div className="flex justify-end">
      <div className="relative flex max-w-[80%] flex-col gap-1.5">
        <div className="rounded-2xl rounded-br-sm bg-violet-600/20 px-3.5 py-2.5 ring-1 ring-inset ring-violet-500/30">
          {content ? (
            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-zinc-100">
              {content}
            </p>
          ) : null}

          {attachments.length > 0 ? (
            <div className="flex flex-col gap-2">
              {attachments.map((a) => (
                <AttachmentRenderer
                  key={a.id}
                  attachment={a}
                  onExpandImage={onExpandImage}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 px-1">
          <span className="font-mono text-[10px] text-zinc-500">
            {remainingLabel}
          </span>

          {content ? (
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
