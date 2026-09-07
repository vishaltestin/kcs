import { readFile, stat } from "node:fs/promises";
import path from "node:path";

/**
 * GET /api/uploads/[...path] — serves uploaded images from public/uploads/
 * with immutable caching (filenames are randomised, content never changes).
 */

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
};

export async function GET(
  _request: Request,
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

    const data = await readFile(filePath);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(info.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
