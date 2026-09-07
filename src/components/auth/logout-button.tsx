"use client";

import { useCallback } from "react";

import { signOut } from "next-auth/react";

import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";

/**
 * Shared sign-out handler.
 *
 * Clears user-scoped client state (cart + wishlist Zustand stores) before
 * revoking the Auth.js session cookie via the HTTP handler. `signOut` then
 * performs a full-page navigation to `callbackUrl`, so server components
 * re-render as a guest.
 *
 * JWT sessions cannot be revoked on other devices (see profile settings);
 * this signs out the current browser only.
 */
export function useLogout() {
  return useCallback(async (callbackUrl = "/") => {
    useCartStore.getState().reset();
    useWishlistStore.getState().reset();
    await signOut({ callbackUrl });
  }, []);
}
