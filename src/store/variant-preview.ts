"use client";

import { create } from "zustand";

/**
 * Which variant the shopper has picked on a product page.
 *
 * The gallery (left column) and the purchase panel (right column) are separate
 * client components inside a server-rendered page, so this tiny store is the
 * channel that lets the selected variant's own photo take over the media stage
 * instead of hiding inside a 48 px chip. It is intentionally NOT persisted and
 * is keyed by product id, so a client-side navigation to another product can
 * never show someone else's variant image.
 */
export type VariantPreview = { image: string | null; label: string };

type VariantPreviewState = {
  productId: string | null;
  preview: VariantPreview | null;
  setPreview: (productId: string, preview: VariantPreview | null) => void;
  clearPreview: () => void;
};

export const useVariantPreview = create<VariantPreviewState>()((set, get) => ({
  productId: null,
  preview: null,

  setPreview: (productId, preview) => {
    const state = get();
    const sameProduct = state.productId === productId;
    const samePreview =
      (state.preview === null && preview === null) ||
      (!!state.preview && !!preview && state.preview.image === preview.image && state.preview.label === preview.label);
    if (sameProduct && samePreview) return;
    set({ productId, preview });
  },

  clearPreview: () => {
    if (get().productId === null && get().preview === null) return;
    set({ productId: null, preview: null });
  },
}));

/** The preview for `productId` only — null for any other product on screen. */
export const selectPreviewFor =
  (productId: string) =>
  (state: VariantPreviewState): VariantPreview | null =>
    state.productId === productId ? state.preview : null;
