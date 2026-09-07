"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { WishlistItem } from "@/types";

/**
 * Client-side wishlist ("Gifting Ideas"), persisted to localStorage like the
 * original store so guests can curate ideas without an account.
 */

type WishlistState = {
  items: WishlistItem[];
  /**
   * Which account the persisted items belong to: null = guest (safe to merge
   * into the next signed-in account), a user id = that account's server
   * truth (never merged into a different account).
   */
  ownerId: string | null;
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (item: WishlistItem) => void;
  isWishlisted: (productId: string) => boolean;
  /** Replaces local state with server truth (signed-in users). */
  hydrate: (items: WishlistItem[], ownerId: string) => void;
  reset: () => void;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      ownerId: null,

      addToWishlist: (item) =>
        set((state) =>
          state.items.some((i) => i.id === item.id) ? state : { items: [...state.items, item] }
        ),

      removeFromWishlist: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== productId) })),

      toggleWishlist: (item) => {
        const exists = get().items.some((i) => i.id === item.id);
        if (exists) {
          get().removeFromWishlist(item.id);
        } else {
          get().addToWishlist(item);
        }
      },

      isWishlisted: (productId) => get().items.some((i) => i.id === productId),

      hydrate: (items, ownerId) => set({ items, ownerId }),

      reset: () => set({ items: [], ownerId: null }),
    }),
    { name: "kcs-wishlist" }
  )
);

export const selectWishlistCount = (state: WishlistState) => state.items.length;
