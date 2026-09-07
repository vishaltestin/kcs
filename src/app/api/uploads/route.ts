import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { auth } from "@/lib/auth/auth";

/**
 * POST /api/uploads — admin-only image upload.
 * Stores files under public/uploads/ with randomised names and returns the
 * servable path (/api/uploads/<name>).
 */

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/gif": ".gif",
};

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

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ ok: false, message: "Missing file field." }, { status: 400 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return Response.json(
      { ok: false, message: "Unsupported format. Use JPG, PNG, WebP, AVIF or GIF." },
      { status: 415 },
    );
  }
  if (file.size > MAX_FILE_BYTES) {
    return Response.json({ ok: false, message: "Image must be under 5 MB." }, { status: 413 });
  }

  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, filename), bytes);

    return Response.json({ ok: true, path: `/api/uploads/${filename}` });
  } catch (error) {
    console.error("Upload failed:", error);
    return Response.json({ ok: false, message: "Upload failed. Try again." }, { status: 500 });
  }
}
