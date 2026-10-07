import { load } from "@cashfreepayments/cashfree-js";

/**
 * Browser-side Cashfree launcher. Only the single-use `paymentSessionId`
 * (minted server-side) ever reaches the client — the secret key stays on
 * the server. Flip between sandbox and production with
 * `NEXT_PUBLIC_CASHFREE_ENV`.
 */
function getMode(): "sandbox" | "production" {
  return process.env.NEXT_PUBLIC_CASHFREE_ENV === "production" ? "production" : "sandbox";
}

/**
 * Opens the Cashfree hosted checkout in the current tab. Cashfree redirects
 * back to `/checkout/return?order_id=…` after the attempt.
 *
 * The pending order number is stashed in sessionStorage so the success page
 * can clear exactly that cart — and only after payment actually succeeded.
 */
export async function launchCashfreeCheckout(
  orderNumber: string,
  paymentSessionId: string,
): Promise<void> {
  try {
    sessionStorage.setItem("kcs-pending-order", orderNumber);
  } catch {
    // Private browsing — the cart just won't auto-clear.
  }
  const cashfree = await load({ mode: getMode() });
  cashfree.checkout({ paymentSessionId, redirectTarget: "_self" });
}
