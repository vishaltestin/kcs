import { readFile, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

/**
 * GET /api/uploads/[...path] — serves uploaded media out of public/uploads/
 * with immutable caching (filenames are randomised, content never changes).
 *
 * Images are small and shown as one block, so they are read into memory. Video
 * is not: players seek by issuing Range requests, and a file that ignores them
 * either fails to open or can never be scrubbed. So video is streamed and
 * honours a byte range.
 */

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".m4v": "video/x-m4v",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".ogg": "video/ogg",
  ".ogv": "video/ogg",
};

const VIDEO_TYPES = new Set(["video/mp4", "video/x-m4v", "video/quicktime", "video/webm", "video/ogg"]);

const CACHE_CONTROL = "public, max-age=31536000, immutable";

/** `bytes=START-END`, `bytes=START-`, `bytes=-SUFFIX`; only a single range. */
function parseRange(header: string | null, size: number) {
  const match = header?.match(/^bytes=(\d*)-(\d*)$/);
  if (!match) return null;
  const [, rawStart, rawEnd] = match;
  if (!rawStart && !rawEnd) return null;

  let start: number;
  let end: number;
  if (!rawStart) {
    const suffix = Number(rawEnd);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    start = Math.max(size - suffix, 0);
    end = size - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd ? Math.min(Number(rawEnd), size - 1) : size - 1;
  }
  if (!Number.isFinite(start) || start >= size || start > end) return { error: true as const, start, end };
  return { error: false as const, start, end };
}

function stream(pathname: string, start: number, end: number) {
  const body = Readable.toWeb(createReadStream(pathname, { start, end })) as unknown as ReadableStream;
  return body;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;

  // Reject anything that could escape the uploads directory.
  const joined = segments.join("/");
  if (!segments.length || segments.some((s) => s.includes("..") || s.includes("/") || s.includes("\\"))) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = path.join(UPLOAD_DIR, joined);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) {
    return new Response("Unsupported file type", { status: 415 });
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) return new Response("Not found", { status: 404 });

    if (!VIDEO_TYPES.has(contentType)) {
      const data = await readFile(filePath);
      return new Response(new Uint8Array(data), {
        headers: { "Content-Type": contentType, "Content-Length": String(info.size), "Cache-Control": CACHE_CONTROL },
      });
    }

    const range = parseRange(request.headers.get("range"), info.size);
    const baseHeaders = {
      "Content-Type": contentType,
      "Cache-Control": CACHE_CONTROL,
      "Accept-Ranges": "bytes",
    } as Record<string, string>;

    if (range?.error) {
      return new Response(null, {
        status: 416,
        headers: { ...baseHeaders, "Content-Range": `bytes */${info.size}` },
      });
    }

    if (!range) {
      return new Response(stream(filePath, 0, info.size - 1), {
        headers: { ...baseHeaders, "Content-Length": String(info.size) },
      });
    }

    const { start, end } = range;
    return new Response(stream(filePath, start, end), {
      status: 206,
      headers: {
        ...baseHeaders,
        "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${info.size}`,
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
