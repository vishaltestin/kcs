import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";

import { authConfig } from "./config";

/**
 * Full Auth.js (NextAuth v5) configuration — server-only (imports Prisma).
 *
 * Sessions use the JWT strategy (required for the credentials provider).
 * `authorize()` is the single place passwords are verified (bcrypt); the
 * JWT carries the user id + role, and the app resolves the fresh user
 * record from the database on every request via `getSessionUser()`.
 *
 * Note: the `signIn`/`signOut` server-action exports are intentionally NOT
 * used by the app — on Next.js 16 the server-action path is unreliable
 * (nextauthjs/next-auth#13388). The client uses the HTTP handlers through
 * `next-auth/react`'s `signIn`/`signOut`, which POST to `/api/auth/*`.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string" ? credentials.email.toLowerCase().trim() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email } });
        // Unverified users and wrong credentials are indistinguishable here
        // (return null → generic error); the login form gates unverified
        // users with a specific message via `preLoginCheckAction`.
        if (!user || !user.emailVerifiedAt) return null;
        if (!(await verifyPassword(password, user.passwordHash))) return null;

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
        };
      },
    }),
  ],
});
