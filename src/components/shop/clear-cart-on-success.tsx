"use client";

import { useEffect } from "react";

import { useCartStore } from "@/store/cart";

/**
 * Clears the cart after a paid checkout — and ONLY then. The checkout hands
 * Cashfree the order number via sessionStorage before leaving; when the
 * success page for that same order renders, the cart (which still holds the
 * just-bought items) is emptied. Revisiting old orders never clears anything.
 */
export function ClearCartOnSuccess({ orderNumber }: { orderNumber: string }) {
  const resetCart = useCartStore((state) => state.reset);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("kcs-pending-order") === orderNumber) {
        resetCart();
        sessionStorage.removeItem("kcs-pending-order");
      }
    } catch {
      // Private browsing — nothing to clear.
    }
  }, [orderNumber, resetCart]);

  return null;
}
