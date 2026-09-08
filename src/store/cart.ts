"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { CartItem } from "@/types";

/**
 * Client-side cart (mirrors the original KCS G-Mart UX where guests can
 * build a cart that persists across visits). The order itself is created
 * through a server action at checkout, with prices recomputed server-side.
 */

type CartState = {
  items: CartItem[];
  addProduct: (item: CartItem) => void;
  removeProduct: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  reset: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addProduct: (item) =>
        set((state) => {
          const minQuantity = Math.max(1, Math.floor(item.minQuantity || 1));
          const addQty = Number.isFinite(item.qty) ? Math.max(1, Math.floor(item.qty)) : minQuantity;
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, qty: Math.max(i.minQuantity, i.qty + addQty) } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, minQuantity, qty: Math.max(minQuantity, addQty) }] };
        }),

      removeProduct: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== productId) })),

      updateQuantity: (productId, qty) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === productId
              ? { ...i, qty: Math.max(i.minQuantity, Number.isFinite(qty) ? Math.floor(qty) : i.minQuantity) }
              : i
          ),
        })),

      reset: () => set({ items: [] }),
    }),
    { name: "kcs-cart" }
  )
);

export const selectCartCount = (state: CartState) => state.items.length;

export const selectCartSubtotal = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.price * item.qty, 0);
