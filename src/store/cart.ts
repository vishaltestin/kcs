"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { CartItem } from "@/types";

/**
 * Client-side cart (mirrors the original KCS G-Mart UX where guests can
 * build a cart that persists across visits). The order itself is created
 * through a server action at checkout, with prices and shipping recomputed
 * server-side.
 *
 * Lines are keyed by `id` = productId, or `${productId}:${variantId}` for a
 * colour/size variant, so the same product in two sizes is two lines.
 */

type CartState = {
  items: CartItem[];
  /**
   * The account this cart belongs to. Guest carts are `null`. When a
   * different account signs in on the same browser the cart is wiped rather
   * than shown to them — persisted localStorage must never leak one
   * customer's basket into another's session.
   */
  ownerId: string | null;
  addProduct: (item: Omit<CartItem, "id"> & { id?: string }) => void;
  removeProduct: (lineId: string) => void;
  updateQuantity: (lineId: string, qty: number) => void;
  reset: () => void;
  /** Declare who the cart belongs to; wipes it when the owner changes. */
  setOwner: (userId: string | null) => void;
};

export function cartLineId(productId: string, variantId?: string | null): string {
  return variantId ? `${productId}:${variantId}` : productId;
}

/** Upgrade lines persisted by the previous (pre-variant) cart shape. */
function normaliseLine(raw: Partial<CartItem> & { id: string }): CartItem {
  const productId = raw.productId ?? raw.id.split(":")[0];
  const variantId = raw.variantId ?? (raw.id.includes(":") ? raw.id.split(":")[1] : null);
  return {
    id: cartLineId(productId, variantId),
    productId,
    variantId,
    variantLabel: raw.variantLabel ?? null,
    slug: raw.slug ?? "",
    name: raw.name ?? "",
    image: raw.image ?? "",
    price: Number(raw.price) || 0,
    mrp: Number(raw.mrp) || 0,
    qty: Math.max(1, Math.floor(Number(raw.qty) || 1)),
    minQuantity: Math.max(1, Math.floor(Number(raw.minQuantity) || 1)),
    weightGrams: Math.max(0, Math.round(Number(raw.weightGrams) || 0)),
    dimensionsCm: raw.dimensionsCm ?? null,
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      ownerId: null,

      addProduct: (item) =>
        set((state) => {
          const line = normaliseLine({ ...item, id: item.id ?? cartLineId(item.productId, item.variantId) });
          const minQuantity = line.minQuantity;
          const addQty = Number.isFinite(item.qty) ? Math.max(1, Math.floor(item.qty)) : minQuantity;
          const existing = state.items.find((i) => i.id === line.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === line.id ? { ...i, ...line, qty: Math.max(i.minQuantity, i.qty + addQty) } : i
              ),
            };
          }
          return { items: [...state.items, { ...line, qty: Math.max(minQuantity, addQty) }] };
        }),

      removeProduct: (lineId) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== lineId) })),

      updateQuantity: (lineId, qty) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === lineId
              ? { ...i, qty: Math.max(i.minQuantity, Number.isFinite(qty) ? Math.floor(qty) : i.minQuantity) }
              : i
          ),
        })),

      reset: () => set({ items: [], ownerId: null }),

      setOwner: (userId) =>
        set((state) => {
          if (state.ownerId === userId) return state;
          // A different account (or guest → account) — never hand one user's
          // basket to another.
          return { items: [], ownerId: userId };
        }),
    }),
    {
      name: "kcs-cart",
      version: 3,
      migrate: (persisted) => {
        const state = persisted as
          | { items?: (Partial<CartItem> & { id: string })[]; ownerId?: string | null }
          | undefined;
        // v2 → v3 adds ownerId; an old cart has no owner, so it is treated as
        // a guest cart and re-bound on next sign-in.
        return {
          items: (state?.items ?? []).map(normaliseLine),
          ownerId: state?.ownerId ?? null,
        } as CartState;
      },
    }
  )
);

export const selectCartCount = (state: CartState) => state.items.length;

export const selectCartSubtotal = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.price * item.qty, 0);
