import { randomBytes } from "node:crypto";

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "CUSTOMER" | "ADMIN" | "VENDOR";
  emailVerifiedAt: Date | null;
  /** Set for VENDOR users — the vendor account this login controls. */
  vendorId: string | null;
}

/**
 * Generates a secure token for signup email verification (not sessions).
 */
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Resolves the authenticated user from the Auth.js JWT session cookie.
 *
 * The JWT only carries the user id (+ role and the session version); the
 * fresh user record is loaded from the database so profile/role changes take
 * effect immediately, and the token's `sessionVersion` must still match the
 * database — bumping it (password change, admin reset, role change) revokes
 * every session issued before the bump.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      emailVerifiedAt: true,
      vendorId: true,
      sessionVersion: true,
    },
  });
  if (!user) return null;

  // Tokens issued before this feature carry no version — treat them as 0 so
  // existing sessions survive the deploy (see deployment notes).
  const tokenVersion = session.user.sessionVersion ?? 0;
  if (tokenVersion !== user.sessionVersion) return null;

  const { sessionVersion: _sessionVersion, ...sessionUser } = user;
  return sessionUser;
}
