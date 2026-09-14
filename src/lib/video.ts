/**
 * One place that decides what a stored "video" string means.
 *
 * Product galleries and the home-page showreel band each keep a single URL, and
 * in practice that URL is a YouTube link, a Vimeo link or a file. Parsing it
 * here means the embed rules — the nocookie host, start offsets, thumbnail,
 * shorts/live/watch shapes — are written once and every surface agrees.
 */

export type VideoSource =
  | {
      kind: "youtube";
      /** 11-char video id. */
      id: string;
      embedUrl: string;
      thumbnailUrl: string;
      startSeconds: number | null;
    }
  | {
      kind: "vimeo";
      id: string;
      embedUrl: string;
      thumbnailUrl: null;
      startSeconds: number | null;
    }
  | {
      kind: "file";
      src: string;
      thumbnailUrl: null;
      startSeconds: null;
    };

const VIDEO_EXT = /\.(mp4|webm|ogg|ogv|mov|m4v)(\?|#|$)/i;
const YOUTUBE_ID = /^[A-Za-z0-9_-]{6,11}$/;
const VIMEO_ID = /^\d{6,12}$/;

/** `90`, `90s`, `1m30s`, `1:30`, `0:02:30` → seconds. */
export function parseStartOffset(value: string | null | undefined): number | null {
  if (!value) return null;
  const raw = value.trim().replace(/^t=?/, "");
  if (!raw) return null;

  const clock = raw.match(/^(\d+:)?\d{1,2}:\d{1,2}$/); // 1:30 / 0:02:30
  if (clock) {
    const total = raw.split(":").reduce((seconds, part) => seconds * 60 + Number(part), 0);
    return Number.isFinite(total) && total >= 0 ? total : null;
  }

  const human = raw.match(/^(?:(\d+)m)?(?:(\d+(?:\.\d+)?)s?)?$/); // 1m30s / 90 / 90s
  if (human && (human[1] || human[2])) {
    const minutes = Number(human[1] ?? 0) * 60;
    const seconds = Math.floor(Number(human[2] ?? 0));
    return minutes + seconds;
  }

  return null;
}

function youtubeSource(id: string | null, startSeconds: number | null): VideoSource | null {
  if (!id || !YOUTUBE_ID.test(id)) return null;
  const params = new URLSearchParams({ rel: "0", modestbranding: "1" });
  if (startSeconds) params.set("start", String(startSeconds));
  return {
    kind: "youtube",
    id,
    // nocookie keeps the embed off the tracking domain; `rel=0` stops YouTube
    // surfacing someone else's related videos at the end of our reel.
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`,
    // `mqdefault` is 320×180, always present for any video, and never
    // letterboxed the way `hqdefault` is.
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
    startSeconds,
  };
}

/**
 * `null` = "this is not a video source we understand". A plain file URL without
 * a known extension still resolves as `file`, so callers that want to be
 * permissive can fall back to it themselves.
 */
export function parseVideoSource(raw: string | null | undefined): VideoSource | null {
  const value = raw?.trim();
  if (!value) return null;

  // Anything the app serves itself (bundled file or /api/uploads/…), or a CDN
  // link that ends in a video extension.
  if (value.startsWith("/") || VIDEO_EXT.test(value)) {
    return { kind: "file", src: value, thumbnailUrl: null, startSeconds: null };
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.replace(/^(?:www|m)\./, "");
  const startSeconds = parseStartOffset(
    url.searchParams.get("t") ?? url.searchParams.get("start") ?? null
  ) ?? parseStartOffset(url.hash.match(/^#t=(.+)$/)?.[1]);

  if (host === "youtu.be") {
    return youtubeSource(url.pathname.split("/").filter(Boolean)[0] ?? null, startSeconds);
  }

  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const segments = url.pathname.split("/").filter(Boolean);
    const fromPath = ["embed", "shorts", "live", "v"].includes(segments[0]) ? segments[1] : null;
    return youtubeSource(url.searchParams.get("v") ?? fromPath, startSeconds);
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const segments = url.pathname.split("/").filter(Boolean);
    const id = (host === "player.vimeo.com" ? segments[1] : segments[0]) ?? null;
    if (!id || !VIMEO_ID.test(id)) return null;
    return {
      kind: "vimeo",
      id,
      embedUrl: `https://player.vimeo.com/video/${id}?dnt=1${startSeconds ? `#t=${startSeconds}s` : ""}`,
      thumbnailUrl: null,
      startSeconds,
    };
  }

  return null;
}

/** Embed URL with autoplay switched on — for players that open on a click. */
export function withAutoplay(source: VideoSource): string {
  if (source.kind === "file") return source.src;
  // `URL` keeps the fragment (`#t=90s` for Vimeo) when it re-serialises, so the
  // start offset survives adding the parameter.
  const url = new URL(source.embedUrl);
  url.searchParams.set("autoplay", "1");
  return url.toString();
}

/** Label for the admin UI, so a saved value is never a mystery. */
export function describeVideoSource(source: VideoSource): string {
  switch (source.kind) {
    case "youtube":
      return `YouTube · ${source.id}${source.startSeconds ? ` · starts at ${source.startSeconds}s` : ""}`;
    case "vimeo":
      return `Vimeo · ${source.id}${source.startSeconds ? ` · starts at ${source.startSeconds}s` : ""}`;
    case "file":
      return "Video file · plays in our own player";
  }
}
