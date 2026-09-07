import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js configuration.
 *
 * This file is imported by `src/proxy.ts` (Next.js middleware, which runs on
 * the edge runtime), so it must never import server-only modules such as
 * Prisma. The full configuration — including the Credentials provider, which
 * needs database access — lives in `src/lib/auth/auth.ts`.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [], // added in src/lib/auth/auth.ts (server-only)
  callbacks: {
    jwt({ token, user }) {
      // On initial sign-in, `user` is the object returned by authorize().
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.id) session.user.id = token.id;
        if (token.role) session.user.role = token.role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
