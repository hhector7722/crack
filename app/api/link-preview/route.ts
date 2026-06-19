import { NextResponse } from "next/server";
import { parseLinkPreviewHtml, titleFromUrl } from "@/lib/link-preview";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL requerida" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Protocolo no permitido");
    }
  } catch {
    return NextResponse.json({ error: "URL inválida" }, { status: 400 });
  }

  try {
    const res = await fetch(parsed.href, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CrackLinkPreview/1.0; +https://crack.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(5000),
      redirect: "follow",
    });

    if (!res.ok) {
      return NextResponse.json({
        title: titleFromUrl(parsed.href),
        image: null,
      });
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return NextResponse.json({
        title: titleFromUrl(parsed.href),
        image: null,
      });
    }

    const html = await res.text();
    const preview = parseLinkPreviewHtml(html.slice(0, 200_000), parsed.href);

    return NextResponse.json({
      title: preview.title ?? titleFromUrl(parsed.href),
      image: preview.image,
    });
  } catch {
    return NextResponse.json({
      title: titleFromUrl(parsed.href),
      image: null,
    });
  }
}
