import NextAuth from "next-auth";

import { authConfig } from "@/lib/auth/config";

/**
 * Next.js middleware (proxy). Uses the edge-safe Auth.js config to validate
 * the JWT session cookie without touching the database.
 */
const { auth } = NextAuth(authConfig);

const PROTECTED_PREFIXES = ["/admin", "/profile", "/checkout", "/order-success"];
const AUTH_PAGES = ["/login", "/signup"];

export default auth((request) => {
  const { pathname, search } = request.nextUrl;
  const session = request.auth;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isAuthPage = AUTH_PAGES.includes(pathname);

  if (isProtected && !session) {
    const signInUrl = new URL("/login", request.nextUrl.origin);
    signInUrl.searchParams.set("next", `${pathname}${search}`);
    return Response.redirect(signInUrl);
  }

  if (session && isAuthPage) {
    return Response.redirect(new URL("/", request.nextUrl.origin));
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static assets; run on everything else.
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico|webmanifest)$).*)",
  ],
};
