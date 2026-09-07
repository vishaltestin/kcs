import { handlers } from "@/lib/auth/auth";

/**
 * Auth.js HTTP handlers. This route is REQUIRED by Auth.js v5 — the client
 * helpers (`signIn`/`signOut` from next-auth/react) and CSRF flow talk to
 * `/api/auth/*`. It is part of the auth infrastructure, not an application
 * API route: application mutations remain server actions.
 */
export const { GET, POST } = handlers;
