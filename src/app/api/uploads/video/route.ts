import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { auth } from "@/lib/auth/auth";

/**
 * POST /api/uploads/video — admin-only video upload (one file).
 *
 * Videos are stored as they arrive; there is nothing to gain from re-encoding
 * them here and everything to lose from a long-running transcode in a request.
 * The file is checked against its container magic bytes so a renamed archive
 * can't end up served to customers.
 *
 * Read the caption in the admin UI before relying on this route: a file that is
 * written to disk only exists for as long as that server's filesystem does, and
 * serverless hosts cap the request body far below any watchable video. For a
 * showreel that has to survive a deploy, link YouTube/Vimeo instead.
 *
 * Response: { ok: true, path, bytes, name }
 */

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_BYTES = 40 * 1024 * 1024;

/** Extension comes from the sniffed container, never from the uploaded name. */
const CONTAINERS: { ext: string; mime: string; matches: (head: Buffer) => boolean }[] = [
  // ISO-BMFF / QuickTime: bytes 4-8 spell "ftyp" (mp4, m4v, mov).
  { ext: ".mp4", mime: "video/mp4", matches: (head) => head.subarray(4, 8).toString("latin1") === "ftyp" },
  { ext: ".webm", mime: "video/webm", matches: (head) => head.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) },
  { ext: ".ogg", mime: "video/ogg", matches: (head) => head.subarray(0, 4).toString("latin1") === "OggS" },
];

const ACCEPTED_TYPES = new Set(["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-m4v"]);

function sniff(bytes: Buffer) {
  return CONTAINERS.find((container) => container.matches(bytes)) ?? null;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return Response.json({ ok: false, message: "Not authorised." }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data")) {
    return Response.json({ ok: false, message: "Send the video as a multipart form upload." }, { status: 400 });
  }

  let formData: FormData;
  try {
    // A body the platform refuses outright never parses — usually because it is
    // bigger than the host allows in a single request, which is worth saying.
    formData = await request.formData();
  } catch {
    return Response.json(
      {
        ok: false,
        message:
          "The upload never reached the server — it is almost certainly larger than this host allows for one request (Vercel: 4.5 MB). Link the video from YouTube or Vimeo instead.",
      },
      { status: 413 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ ok: false, message: "No video received." }, { status: 400 });
  }
  if (file.type && !ACCEPTED_TYPES.has(file.type)) {
    return Response.json(
      { ok: false, message: "Unsupported video. Use MP4 (H.264), WebM or OGG — MP4 plays everywhere." },
      { status: 415 },
    );
  }
  if (file.size > MAX_FILE_BYTES) {
    return Response.json({ ok: false, message: "Video must be under 40 MB. A link to YouTube has no such limit." }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const container = sniff(bytes.subarray(0, 16));
  if (!container) {
    return Response.json({ ok: false, message: "That file is not an MP4, WebM or OGG video." }, { status: 415 });
  }

  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${container.ext}`;
    await writeFile(path.join(UPLOAD_DIR, filename), bytes, { flag: "wx" });
    return Response.json({ ok: true, path: `/api/uploads/${filename}`, mime: container.mime, bytes: file.size, name: file.name });
  } catch (error) {
    console.error("Video upload failed:", file.name, error);
    const readonly = typeof error === "object" && error && "code" in error && error.code === "EROFS";
    return Response.json(
      {
        ok: false,
        message: readonly
          ? "This host's filesystem is read-only, so uploaded files cannot be stored. Use a YouTube or Vimeo link, or commit the file into public/video/ when you deploy."
          : "Could not write the file. Check the upload directory permissions.",
      },
      { status: 500 },
    );
  }
}
