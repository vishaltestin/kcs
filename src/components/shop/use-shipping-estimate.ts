"use client";

import { useEffect, useState } from "react";

import { estimateShippingAction, type ShippingEstimate } from "@/actions/shipping";
import type { CartItem } from "@/types";

/**
 * Debounced live shipping estimate for a set of cart lines + destination
 * state. Returns `null` while nothing has been computed yet.
 */
export function useShippingEstimate(items: CartItem[], state: string, subtotal: number) {
  const [estimate, setEstimate] = useState<ShippingEstimate | null>(null);
  const [loading, setLoading] = useState(false);

  // Stable signature so we only refetch when something relevant changed.
  const signature = JSON.stringify([
    items.map((i) => [i.productId, i.variantId, i.qty, i.weightGrams, i.dimensionsCm]),
    state.trim().toLowerCase(),
    Math.round(subtotal),
  ]);

  useEffect(() => {
    if (items.length === 0) {
      const timer = setTimeout(() => setEstimate(null), 0);
      return () => clearTimeout(timer);
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      const result = await estimateShippingAction({
        lines: items.map((i) => ({
          quantity: i.qty,
          weightGrams: i.weightGrams,
          lengthCm: i.dimensionsCm?.length ?? 0,
          widthCm: i.dimensionsCm?.width ?? 0,
          heightCm: i.dimensionsCm?.height ?? 0,
        })),
        state,
        subtotal,
      });
      if (!cancelled) {
        setEstimate(result);
        setLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- signature captures every input
  }, [signature]);

  return { estimate, loading };
}
