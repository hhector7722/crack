"use client";

import { splitTextWithUrls } from "@/lib/drop/helpers";

export function DropTextContent({ content }: { content: string }) {
  const parts = splitTextWithUrls(content);

  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-zinc-100">
      {parts.map((part, index) =>
        part.type === "url" ? (
          <a
            key={index}
            href={part.value}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-violet-400 underline decoration-violet-400/50 underline-offset-2 hover:text-violet-300"
          >
            {part.value}
          </a>
        ) : (
          <span key={index}>{part.value}</span>
        )
      )}
    </p>
  );
}
