"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";

import { toast } from "sonner";

import { useWishlistStore } from "@/store/wishlist";
import {
  clearWishlistAction,
  mergeGuestWishlistAction,
  toggleWishlistAction,
} from "@/actions/wishlist";
import type { WishlistItem } from "@/types";

/**
 * Bridges the guest wishlist (localStorage) with the per-user server
 * wishlist. Data isolation rules:
 *
 * - Guests: toggles stay in localStorage (`kcs-wishlist`, ownerId = null).
 * - Signed-in users: the DB is the source of truth, scoped by userId. The
 *   local store is marked with the owning user's id (`ownerId`) and hydrated
 *   from the server on mount.
 * - Guest items (ownerId = null) are merged into the account on sign-in.
 *   Items owned by a DIFFERENT account are never merged or shown — they are
 *   discarded when the store is re-hydrated.
 * - Logout resets the store (see navbar / mobile-nav) so a shared browser
 *   never leaks one account's data to the next.
 */

type WishlistContextValue = {
  isAuthenticated: boolean;
  items: WishlistItem[];
  isWishlisted: (productId: string) => boolean;
  toggle: (item: WishlistItem) => void;
  remove: (productId: string) => void;
  clearAll: () => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({
  userId,
  serverItems,
  children,
}: {
  userId: string | null;
  serverItems: WishlistItem[];
  children: React.ReactNode;
}) {
  const items = useWishlistStore((state) => state.items);
  const hydrate = useWishlistStore((state) => state.hydrate);
  const toggleLocal = useWishlistStore((state) => state.toggleWishlist);
  const removeFromLocal = useWishlistStore((state) => state.removeFromWishlist);
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    if (!userId || bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    const { items: localItems, ownerId } = useWishlistStore.getState();
    const guestItems = ownerId === null ? localItems : [];

    if (guestItems.length > 0) {
      // Merge genuine guest items into the account, then hydrate with
      // server truth (which includes the freshly merged items).
      mergeGuestWishlistAction(guestItems.map((i) => i.id))
        .then((result) => {
          const serverIds = new Set(serverItems.map((i) => i.id));
          const mergedGuests = result.ok
            ? guestItems.filter((i) => !serverIds.has(i.id))
            : [];
          hydrate([...mergedGuests, ...serverItems], userId);
        })
        .catch(() => hydrate(serverItems, userId));
    } else {
      // Items owned by another account are discarded — never shown or merged.
      hydrate(serverItems, userId);
    }
    // serverItems changes per page load; bootstrap runs once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const toggle = useCallback(
    (item: WishlistItem) => {
      const exists = items.some((i) => i.id === item.id);

      if (!userId) {
        toggleLocal(item);
        toast.success(exists ? "Removed from wishlist" : "Added to wishlist", {
          description: item.name,
        });
        return;
      }

      // Optimistic local toggle, mirrored to the per-user server wishlist.
      toggleLocal(item);
      toggleWishlistAction(item.id)
        .then((result) => {
          if (!result.ok) {
            toggleLocal(item); // revert
            toast.error(result.message);
            return;
          }
          toast.success(result.message, { description: item.name });
        })
        .catch(() => {
          toggleLocal(item); // revert
          toast.error("Could not update your wishlist. Please try again.");
        });
    },
    [userId, items, toggleLocal]
  );

  const remove = useCallback(
    (productId: string) => {
      const item = items.find((i) => i.id === productId);
      if (item) {
        toggle(item);
      } else {
        removeFromLocal(productId);
      }
    },
    [items, toggle, removeFromLocal]
  );

  const clearAll = useCallback(() => {
    if (!userId) {
      useWishlistStore.getState().reset();
      return;
    }
    clearWishlistAction()
      .then((result) => {
        if (result.ok) {
          useWishlistStore.getState().reset();
          useWishlistStore.getState().hydrate([], userId);
          toast.success("Wishlist cleared.");
        } else {
          toast.error(result.message);
        }
      })
      .catch(() => toast.error("Could not clear your wishlist. Please try again."));
  }, [userId]);

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(userId),
      items,
      isWishlisted: (productId: string) => items.some((i) => i.id === productId),
      toggle,
      remove,
      clearAll,
    }),
    [userId, items, toggle, remove, clearAll]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within <WishlistProvider>");
  }
  return context;
}
