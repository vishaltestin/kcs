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
  addProduct: (item: Omit<CartItem, "id"> & { id?: string }) => void;
  removeProduct: (lineId: string) => void;
  updateQuantity: (lineId: string, qty: number) => void;
  reset: () => void;
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

      reset: () => set({ items: [] }),
    }),
    {
      name: "kcs-cart",
      version: 2,
      migrate: (persisted) => {
        const state = persisted as { items?: (Partial<CartItem> & { id: string })[] } | undefined;
        return { items: (state?.items ?? []).map(normaliseLine) } as CartState;
      },
    }
  )
);

export const selectCartCount = (state: CartState) => state.items.length;

export const selectCartSubtotal = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.price * item.qty, 0);
