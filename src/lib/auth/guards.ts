import { redirect } from "next/navigation";

import { getSessionUser, type SessionUser } from "@/lib/auth/session";

/**
 * Route guards for server components, layouts and server actions.
 */

export async function getCurrentUser(): Promise<SessionUser | null> {
  return getSessionUser();
}

/** Require any authenticated user, or redirect to login. */
export async function requireUser(nextPath?: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    const next = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/login${next}`);
  }
  return user;
}

/** Require an ADMIN user, or redirect. Customers land on a 403 page. */
export async function requireAdmin(nextPath?: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    const next = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/login${next}`);
  }
  if (user.role !== "ADMIN") {
    redirect("/403");
  }
  return user;
}

/** Guard for server actions — throws instead of redirecting. */
export async function assertAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized: admin access required.");
  }
  return user;
}
