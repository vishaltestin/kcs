import "server-only";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";

/**
 * Shared guard for the upload routes.
 *
 * Authorisation is resolved from the *database* (via `getSessionUser()`,
 * which also enforces sessionVersion) rather than the role baked into the
 * JWT, and a vendor's live status is checked on every request — a suspended
 * vendor loses upload access immediately, not at token expiry.
 */

export type Uploader = {
  userId: string;
  role: "ADMIN" | "VENDOR";
  /** Storage namespace: uploads land in `public/uploads/<namespace>/`. */
  namespace: string;
};

export async function resolveUploader(): Promise<Uploader | null> {
  const user = await getSessionUser();
  if (!user) return null;

  if (user.role === "ADMIN") {
    return { userId: user.id, role: "ADMIN", namespace: "admin" };
  }

  if (user.role === "VENDOR" && user.vendorId) {
    const vendor = await db.vendor.findUnique({
      where: { id: user.vendorId },
      select: { status: true },
    });
    if (!vendor || vendor.status !== "ACTIVE") return null;
    return { userId: user.id, role: "VENDOR", namespace: `vendor-${user.vendorId}` };
  }

  return null;
}

/**
 * Cheap CSRF guard: browsers send `Origin` on cross-origin POSTs. Requests
 * without an Origin header (server-side calls, curl) are allowed through —
 * they still need a valid session cookie.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
