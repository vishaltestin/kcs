"use client";

import { useEffect } from "react";

import { signOut } from "next-auth/react";

/**
 * Clears a session cookie the server no longer recognises.
 *
 * The JWT strategy means a cookie can outlive the session it represents: if
 * `sessionVersion` was bumped (password change, admin reset, role change) the
 * app treats the visitor as signed out, but the browser keeps sending the old
 * cookie. The middleware — which can't reach the database — still counts that
 * cookie as a session, so leaving it in place keeps the two disagreeing.
 *
 * The login / signup pages render this with `stale` set when they see a cookie
 * but no matching database user; signing out clears it quietly, and the POST
 * also lands a fresh (empty) cookie.
 */
export function ClearStaleSession({ stale }: { stale: boolean }) {
  useEffect(() => {
    if (!stale) return;
    void signOut({ redirect: false });
  }, [stale]);

  return null;
}
