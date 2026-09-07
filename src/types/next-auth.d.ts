import type { DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

/**
 * Auth.js type augmentation.
 *
 * Note: the `import type { DefaultJWT } from "next-auth/jwt"` below (plus the
 * re-export) is load-bearing — TypeScript only applies `declare module`
 * augmentations for modules that are part of the compiled program, and
 * nothing else imports "next-auth/jwt" directly. Without it, the JWT
 * augmentation silently no-ops.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "CUSTOMER" | "ADMIN";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "CUSTOMER" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "CUSTOMER" | "ADMIN";
  }
}

// Keep both augmented modules in the program (see note above).
export type { DefaultJWT };
