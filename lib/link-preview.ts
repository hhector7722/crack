export function titleFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (parsed.pathname && parsed.pathname !== "/") {
      const segment = parsed.pathname.split("/").filter(Boolean).pop();
      if (segment) {
        const decoded = decodeURIComponent(segment)
          .replace(/\.(html?|php|aspx?)$/i, "")
          .replace(/[-_+]/g, " ")
          .trim();
        if (decoded.length > 0 && decoded.length < 80) {
          return decoded;
        }
      }
    }

    return host;
  } catch {
    return "Enlace";
  }
}

function decodeMeta(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function readMeta(html: string, key: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeMeta(match[1]);
  }
  return null;
}

export function parseLinkPreviewHtml(html: string, baseUrl: string) {
  const title =
    readMeta(html, "og:title") ??
    readMeta(html, "twitter:title") ??
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ??
    null;

  let image =
    readMeta(html, "og:image") ?? readMeta(html, "twitter:image") ?? null;

  if (image) {
    try {
      image = new URL(image, baseUrl).href;
    } catch {
      image = null;
    }
  }

  return { title: title ? decodeMeta(title) : null, image };
}

export function resolveLinkTitle(
  url: string,
  previewTitle: string | null | undefined,
  itemTitle: string | null | undefined
): string {
  const normalizedItemTitle = itemTitle?.trim();
  if (
    normalizedItemTitle &&
    normalizedItemTitle !== url &&
    !normalizedItemTitle.includes("http")
  ) {
    return normalizedItemTitle;
  }
  if (previewTitle?.trim()) return previewTitle.trim();
  return titleFromUrl(url);
}
