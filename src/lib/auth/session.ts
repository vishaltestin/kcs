import { randomBytes } from "node:crypto";

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "CUSTOMER" | "ADMIN";
  emailVerifiedAt: Date | null;
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
 * The JWT only carries the user id (+ role); the fresh user record is loaded
 * from the database so that profile/role changes take effect immediately.
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
    },
  });

  return user;
}
