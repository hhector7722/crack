import { decodeHtmlEntities } from "@/lib/utils";

export interface XPostUrl {
  handle: string;
  id: string;
  canonicalUrl: string;
}

export function parseXPostUrl(value: string): XPostUrl | null {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (!["x.com", "www.x.com", "mobile.x.com", "twitter.com", "www.twitter.com", "mobile.twitter.com"].includes(host)) {
      return null;
    }
    const match = url.pathname.match(/^\/([a-zA-Z0-9_]{1,15})\/status\/([0-9]{10,25})(?:\/|$)/);
    if (!match) return null;
    return {
      handle: match[1],
      id: match[2],
      // Tracking parameters can also contain accidentally concatenated URLs
      // (including share tokens). They must never be forwarded to preview providers.
      canonicalUrl: "https://x.com/" + match[1] + "/status/" + match[2],
    };
  } catch {
    return null;
  }
}

export function normalizeSavedLinkUrl(value: string): string {
  const post = parseXPostUrl(value);
  if (post) return post.canonicalUrl;
  return value;
}

export function titleFromUrl(url: string): string {
  const xPost = parseXPostUrl(url);
  if (xPost) return "Publicación de @" + xPost.handle;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (parsed.pathname && parsed.pathname !== "/") {
      const segment = parsed.pathname.split("/").filter(Boolean).pop();
      if (segment && !/^\d{10,}$/.test(segment)) {
        const decoded = decodeURIComponent(segment)
          .replace(/\.(html?|php|aspx?)$/i, "")
          .replace(/[-_+]/g, " ")
          .trim();
        if (decoded.length > 0 && decoded.length < 80) return decoded;
      }
    }
    return host;
  } catch {
    return "Enlace";
  }
}

function decodeMeta(value: string): string {
  return decodeHtmlEntities(value).trim();
}

function readMeta(html: string, key: string): string | null {
  const patterns = [
    new RegExp(
      "<meta[^>]+(?:property|name)=[\"']" + key + "[\"'][^>]+content=[\"']([^\"']+)[\"']",
      "i"
    ),
    new RegExp(
      "<meta[^>]+content=[\"']([^\"']+)[\"'][^>]+(?:property|name)=[\"']" + key + "[\"']",
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
  author?: string | null;
  handle?: string | null;
}

export function parseLinkPreviewHtml(html: string, baseUrl: string): LinkPreviewData {
  const title =
    readMeta(html, "og:title") ??
    readMeta(html, "twitter:title") ??
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ??
    null;
  let image = readMeta(html, "og:image") ?? readMeta(html, "twitter:image") ?? null;
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

type XPostData = {
  text?: string;
  author?: { name?: string; screen_name?: string };
  media?: {
    photos?: Array<{ url?: string }>;
    videos?: Array<{ thumbnail_url?: string }>;
    all?: Array<{ type?: string; url?: string; thumbnail_url?: string }>;
  };
};

function tweetTitle(text: string, fallback: string): string {
  const firstLine = text.split(/\r?\n/).map((line) => line.trim()).find(Boolean) || "";
  if (!firstLine) return fallback;
  return firstLine.length > 120 ? firstLine.slice(0, 117).trimEnd() + "…" : firstLine;
}

async function fetchXPostPreview(post: XPostUrl): Promise<LinkPreviewData | null> {
  try {
    // Fixed API origin + strictly validated handle/ID (no arbitrary fetch URLs).
    const endpoint = "https://api.fxtwitter.com/" + post.handle + "/status/" + post.id;
    const res = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(6500),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;

    const payload = await res.json() as {
      code?: number;
      tweet?: XPostData;
      status?: XPostData;
    };
    if (payload.code && payload.code !== 200) return null;
    const tweet = payload.tweet ?? payload.status;
    if (!tweet) return null;
    const body = typeof tweet.text === "string" ? tweet.text.trim() : "";
    const handle = tweet.author?.screen_name || post.handle;
    const author = tweet.author?.name || "@" + handle;
    const media = tweet.media;
    const photo = media?.photos?.find((photo) => photo.url)?.url
      || media?.all?.find((item) => item.type === "photo" && item.url)?.url;
    const videoThumbnail = media?.videos?.find((video) => video.thumbnail_url)?.thumbnail_url
      || media?.all?.find((item) => item.type === "video" && item.thumbnail_url)?.thumbnail_url;
    const image = photo || videoThumbnail || null;

    return {
      title: tweetTitle(body, "Publicación de @" + handle),
      image: image && /^https:\/\//.test(image) ? image : null,
      description: body ? body.slice(0, 4000) : null,
      author,
      handle,
    };
  } catch {
    return null;
  }
}

export async function fetchLinkPreview(rawUrl: string): Promise<LinkPreviewData> {
  const url = normalizeSavedLinkUrl(rawUrl);
  let parsed: URL;
  try {
    parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { title: titleFromUrl(url), image: null, description: null };
    }
  } catch {
    return { title: titleFromUrl(url), image: null, description: null };
  }

  const xPost = parseXPostUrl(url);
  if (xPost) {
    const preview = await fetchXPostPreview(xPost);
    if (preview) return preview;
  }

  let fetchUrl = parsed.href;
  let userAgent = "Mozilla/5.0 (compatible; CrackLinkPreview/1.0)";
  if (xPost) {
    fetchUrl = "https://vxtwitter.com/" + xPost.handle + "/status/" + xPost.id;
    userAgent = "Mozilla/5.0 (compatible; Discordbot/2.0)";
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

    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("text/html")) {
      return { title: titleFromUrl(url), image: null, description: null };
    }
    const html = await res.text();
    const preview = parseLinkPreviewHtml(html.slice(0, 200_000), fetchUrl);
    // Some embedding services return a bare numeric status ID as the title.
    const validTitle = preview.title && !/^\d{10,}$/.test(preview.title.trim());
    return {
      title: validTitle ? preview.title : titleFromUrl(url),
      image: preview.image,
      description: preview.description,
      handle: xPost?.handle ?? null,
    };
  } catch {
    return { title: titleFromUrl(url), image: null, description: null };
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
    !normalizedItemTitle.includes("http") &&
    !/^\d{10,}$/.test(normalizedItemTitle)
  ) {
    return normalizedItemTitle;
  }
  if (previewTitle?.trim() && !/^\d{10,}$/.test(previewTitle.trim())) return previewTitle.trim();
  return titleFromUrl(url);
}
