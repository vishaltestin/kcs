import NextAuth from "next-auth";

import { authConfig } from "@/lib/auth/config";

/**
 * Next.js middleware (proxy). Uses the edge-safe Auth.js config to validate
 * the JWT session cookie without touching the database.
 */
const { auth } = NextAuth(authConfig);

const PROTECTED_PREFIXES = ["/admin", "/vendor", "/profile", "/checkout", "/order-success", "/payment-failed"];

export default auth((request) => {
  const { pathname, search } = request.nextUrl;
  const session = request.auth;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (isProtected && !session) {
    const signInUrl = new URL("/login", request.nextUrl.origin);
    signInUrl.searchParams.set("next", `${pathname}${search}`);
    return Response.redirect(signInUrl);
  }

  // Deliberately NO "already signed in? go home" redirect for AUTH_PAGES.
  //
  // The middleware only sees the JWT cookie — it cannot reach the database to
  // check whether that session is still valid. A cookie the app has revoked
  // (password change, admin reset, role change: see `sessionVersion`) looks
  // perfectly valid here, so bouncing signed-in-looking users off /login made
  // the login page unreachable for exactly the people who needed it:
  //
  //   /checkout → requireUser() finds no valid session → /login?next=/checkout
  //              → middleware sees the stale cookie → "/" (home)
  //
  // The user was sent home instead of being asked to sign in again. The
  // "already signed in" bounce now lives in the login/signup pages, which can
  // verify the session against the database (see `(auth)/login/page.tsx`).
});

export const config = {
  matcher: [
    // Skip Next.js internals and static assets; run on everything else.
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico|webmanifest)$).*)",
  ],
};
