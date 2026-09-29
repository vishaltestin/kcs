import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";

/**
 * Route guards for server components, layouts and server actions.
 */

/** Vendor row resolved for an authenticated VENDOR user. */
export type VendorSession = {
  id: string;
  name: string;
  slug: string;
  status: "ACTIVE" | "SUSPENDED";
  isDefault: boolean;
};

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

/** Admins and vendor users — used for shared tooling like image uploads. */
export async function assertAdminOrVendor(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "VENDOR")) {
    throw new Error("Unauthorized: admin or vendor access required.");
  }
  return user;
}

async function resolveVendor(vendorId: string | null): Promise<VendorSession | null> {
  if (!vendorId) return null;
  return db.vendor.findUnique({
    where: { id: vendorId },
    select: { id: true, name: true, slug: true, status: true, isDefault: true },
  });
}

/**
 * Require a VENDOR user with a linked vendor account, or redirect.
 * Suspended vendors still pass (the portal shows a suspension notice) —
 * mutation guards use `assertVendor`, which blocks them.
 */
export async function requireVendor(
  nextPath?: string,
): Promise<{ user: SessionUser; vendor: VendorSession }> {
  const user = await getSessionUser();
  if (!user) {
    const next = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/login${next}`);
  }
  if (user.role !== "VENDOR") {
    redirect("/403");
  }
  const vendor = await resolveVendor(user.vendorId);
  if (!vendor) {
    redirect("/403");
  }
  return { user, vendor };
}

/** Guard for vendor server actions — throws instead of redirecting. */
export async function assertVendor(): Promise<{ user: SessionUser; vendor: VendorSession }> {
  const user = await getSessionUser();
  if (!user || user.role !== "VENDOR") {
    throw new Error("Unauthorized: vendor access required.");
  }
  const vendor = await resolveVendor(user.vendorId);
  if (!vendor) {
    throw new Error("Unauthorized: no vendor account is linked to this login.");
  }
  if (vendor.status !== "ACTIVE") {
    throw new Error("Your seller account is suspended. Contact support for details.");
  }
  return { user, vendor };
}
