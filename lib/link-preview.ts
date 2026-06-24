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

export interface LinkPreviewData {
  title: string | null;
  image: string | null;
  description: string | null;
}

export function parseLinkPreviewHtml(html: string, baseUrl: string): LinkPreviewData {
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

  const description =
    readMeta(html, "og:description") ??
    readMeta(html, "twitter:description") ??
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
    null;

  return {
    title: title ? decodeMeta(title) : null,
    image,
    description: description ? decodeMeta(description) : null,
  };
}

export async function fetchLinkPreview(url: string): Promise<LinkPreviewData> {
  let parsed: URL;
  try {
    parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { title: titleFromUrl(url), image: null, description: null };
    }
  } catch {
    return { title: titleFromUrl(url), image: null, description: null };
  }

  let fetchUrl = parsed.href;
  let userAgent = "Mozilla/5.0 (compatible; CrackLinkPreview/1.0; +https://crack.app)";

  if (
    parsed.hostname === "x.com" ||
    parsed.hostname === "twitter.com" ||
    parsed.hostname === "www.x.com" ||
    parsed.hostname === "www.twitter.com"
  ) {
    parsed.hostname = "vxtwitter.com";
    fetchUrl = parsed.href;
    userAgent = "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)";
  }

  try {
    const res = await fetch(fetchUrl, {
      headers: {
        "User-Agent": userAgent,
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(5000),
      redirect: "follow",
    });

    if (!res.ok) {
      return { title: titleFromUrl(parsed.href), image: null, description: null };
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return { title: titleFromUrl(parsed.href), image: null, description: null };
    }

    const html = await res.text();
    const preview = parseLinkPreviewHtml(html.slice(0, 200_000), parsed.href);

    return {
      title: preview.title ?? titleFromUrl(parsed.href),
      image: preview.image,
      description: preview.description,
    };
  } catch {
    return { title: titleFromUrl(parsed.href), image: null, description: null };
  }
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
