import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { auth } from "@/lib/auth/auth";

/**
 * POST /api/uploads — admin-only image upload (one or many files).
 *
 * Every image is normalised with sharp before it touches the disk:
 *   • auto-rotated from EXIF, metadata stripped
 *   • downscaled so the longest edge is ≤ 1600 px (never upscaled)
 *   • re-encoded as WebP (quality 82) — typically 3–6× smaller than the
 *     original JPG/PNG while staying crisp on retina screens
 *   • animated GIFs are kept as GIF so they still animate
 *
 * Files are stored under public/uploads/ with randomised names and served
 * via /api/uploads/<name> with immutable caching.
 *
 * Response: { ok: true, files: [{ path, width, height, bytes, name }] }
 * Per-file failures are reported in `errors` without failing the batch.
 */

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_BYTES = 12 * 1024 * 1024; // 12 MB in — output is far smaller
const MAX_FILES = 12;
const MAX_EDGE = 1600;
const WEBP_QUALITY = 82;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

type Uploaded = { path: string; width: number; height: number; bytes: number; name: string };

async function processFile(file: File): Promise<Uploaded> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Unsupported format. Use JPG, PNG, WebP, AVIF or GIF.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Image must be under 12 MB.");
  }

  const input = Buffer.from(await file.arrayBuffer());
  const isGif = file.type === "image/gif";

  const pipeline = sharp(input, { animated: isGif, failOn: "none" })
    .rotate()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true });

  const output = isGif
    ? await pipeline.gif().toBuffer({ resolveWithObject: true })
    : await pipeline.webp({ quality: WEBP_QUALITY, effort: 4 }).toBuffer({ resolveWithObject: true });

  const ext = isGif ? ".gif" : ".webp";
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
  await writeFile(path.join(UPLOAD_DIR, filename), output.data);

  return {
    path: `/api/uploads/${filename}`,
    width: output.info.width,
    height: output.info.height,
    bytes: output.info.size,
    name: file.name,
  };
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return Response.json({ ok: false, message: "Not authorised." }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ ok: false, message: "Expected multipart form data." }, { status: 400 });
  }

  // Accept both the legacy single `file` field and the new `files` field.
  const files = [...formData.getAll("files"), ...formData.getAll("file")].filter(
    (entry): entry is File => entry instanceof File && entry.size > 0,
  );
  if (files.length === 0) {
    return Response.json({ ok: false, message: "No image received." }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return Response.json({ ok: false, message: `Upload at most ${MAX_FILES} images at a time.` }, { status: 400 });
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const uploaded: Uploaded[] = [];
  const errors: { name: string; message: string }[] = [];
  for (const file of files) {
    try {
      uploaded.push(await processFile(file));
    } catch (error) {
      console.error("Upload failed:", file.name, error);
      errors.push({
        name: file.name,
        message: error instanceof Error ? error.message : "Could not process this image.",
      });
    }
  }

  if (uploaded.length === 0) {
    return Response.json(
      { ok: false, message: errors[0]?.message ?? "Upload failed. Try again.", errors },
      { status: 422 },
    );
  }

  return Response.json({
    ok: true,
    // Backwards compatible single-path field for older callers.
    path: uploaded[0].path,
    files: uploaded,
    errors,
  });
}
