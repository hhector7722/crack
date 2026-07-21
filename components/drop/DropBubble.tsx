"use client";

import type { Drop, DropAttachment } from "@/lib/drop/types";
import {
  firstUrlInText,
  formatRemaining,
  isPreviewablePath,
  isStandaloneUrl,
} from "@/lib/drop/helpers";
import { useLongPress } from "@/hooks/use-long-press";
import { downloadSignedFile } from "@/lib/drop/signed-url-cache";
import { DropTextContent } from "./DropTextContent";
import { BubbleImage } from "./bubbles/BubbleImage";
import { BubbleAudio } from "./bubbles/BubbleAudio";
import { BubbleVideo } from "./bubbles/BubbleVideo";
import { BubbleFile } from "./bubbles/BubbleFile";
import { BubbleLinkPreview } from "./bubbles/BubbleLinkPreview";

function FloatingAttachment({
  attachment,
  imagePaths,
  videoPaths,
  onExpandImage,
  onExpandVideo,
  onContentResize,
  consumeLongPress,
}: {
  attachment: DropAttachment;
  imagePaths: string[];
  videoPaths: string[];
  onExpandImage: (paths: string[], index: number) => void;
  onExpandVideo: (paths: string[], index: number) => void;
  onContentResize?: () => void;
  consumeLongPress: () => boolean;
}) {
  switch (attachment.content_type) {
    case "image":
      return (
        <BubbleImage
          path={attachment.file_url}
          onLoad={onContentResize}
          onExpand={() => {
            if (consumeLongPress()) return;
            onExpandImage(imagePaths, imagePaths.indexOf(attachment.file_url));
          }}
        />
      );
    case "video":
      return (
        <BubbleVideo
          path={attachment.file_url}
          onLoad={onContentResize}
          onExpand={() => {
            if (consumeLongPress()) return;
            onExpandVideo(videoPaths, videoPaths.indexOf(attachment.file_url));
          }}
        />
      );
    case "audio":
      return <BubbleAudio path={attachment.file_url} />;
    case "file":
      return (
        <BubbleFile
          path={attachment.file_url}
          onOpen={(url) => {
            if (consumeLongPress()) return;
            if (isPreviewablePath(attachment.file_url)) {
              window.open(url, "_blank", "noopener,noreferrer");
              return;
            }
            void downloadSignedFile(attachment.file_url);
          }}
        />
      );
    default:
      return null;
  }
}

export function DropBubble({
  drop,
  now,
  onExpandImage,
  onExpandVideo,
  onOpenActions,
  onContentResize,
}: {
  drop: Drop;
  now: number;
  onExpandImage: (paths: string[], index: number) => void;
  onExpandVideo: (paths: string[], index: number) => void;
  onOpenActions: (drop: Drop) => void;
  onContentResize?: () => void;
}) {
  const { attachments, content } = drop;
  const longPress = useLongPress(() => onOpenActions(drop));

  const imageAttachments = attachments.filter((a) => a.content_type === "image");
  const videoAttachments = attachments.filter((a) => a.content_type === "video");
  const audioAttachments = attachments.filter((a) => a.content_type === "audio");
  const fileAttachments = attachments.filter((a) => a.content_type === "file");
  const gridAttachments = [
    ...imageAttachments,
    ...videoAttachments,
    ...fileAttachments,
  ];

  const imagePaths = imageAttachments.map((a) => a.file_url);
  const videoPaths = videoAttachments.map((a) => a.file_url);
  const trimmedContent = content?.trim() ?? "";
  const hasText = Boolean(trimmedContent);
  const standaloneUrl = hasText && isStandaloneUrl(trimmedContent);
  const previewUrl =
    hasText && !standaloneUrl ? firstUrlInText(trimmedContent) : null;

  const remainingLabel =
    now === 0 ? "--" : formatRemaining(drop.expires_at, now);

  function consumeLongPress() {
    return longPress.consumeLongPress();
  }

  return (
    <div className="flex min-w-0 justify-end" {...longPress}>
      <div className="relative flex min-w-0 max-w-[80%] flex-col items-end gap-1.5">
        {standaloneUrl ? (
          <BubbleLinkPreview url={trimmedContent} onLoad={onContentResize} />
        ) : hasText ? (
          <>
            <div className="min-w-0 max-w-full break-words rounded-2xl rounded-br-sm bg-[#1c1c1e] px-3.5 py-2.5">
              <DropTextContent content={content!} />
            </div>
            {previewUrl ? (
              <BubbleLinkPreview url={previewUrl} onLoad={onContentResize} />
            ) : null}
          </>
        ) : null}

        {gridAttachments.length > 0 ? (
          <div className="flex max-w-full flex-wrap justify-end gap-1.5">
            {gridAttachments.map((a) => (
              <FloatingAttachment
                key={a.id}
                attachment={a}
                imagePaths={imagePaths}
                videoPaths={videoPaths}
                onExpandImage={onExpandImage}
                onExpandVideo={onExpandVideo}
                onContentResize={onContentResize}
                consumeLongPress={consumeLongPress}
              />
            ))}
          </div>
        ) : null}

        {audioAttachments.length > 0 ? (
          <div className="flex w-full flex-col items-end gap-2">
            {audioAttachments.map((a) => (
              <BubbleAudio key={a.id} path={a.file_url} />
            ))}
          </div>
        ) : null}

        <div className="px-1">
          <span className="font-mono text-[10px] text-zinc-500">
            {remainingLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
