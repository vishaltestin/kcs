"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { limitKey, rateLimit } from "@/lib/rate-limit";
import { CashfreeError } from "@/lib/cashfree";
import { createPaymentSessionForOrder } from "@/lib/order-payments";
import type { CheckoutSession } from "@/actions/orders";
import type { ActionResult } from "@/types";

/**
 * Mints a fresh single-use Cashfree session for an unpaid order — the "Try
 * payment again" path from the payment-failed page and the profile.
 *
 * Verify-first (inside `createPaymentSessionForOrder`): if the money already
 * arrived, the order is confirmed locally and the customer goes straight to
 * the success page — retrying can never double-charge.
 */
export async function retryPaymentAction(orderNumber: string): Promise<ActionResult<CheckoutSession>> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, message: "Please sign in to continue." };
  }

  const allowed = rateLimit(await limitKey("payment-retry"), 10, 60_000);
  if (!allowed) {
    return { ok: false, message: "Too many attempts. Please try again shortly." };
  }

  const order = await db.order.findFirst({
    where: { orderNumber, userId: user.id, parentId: null },
    select: { id: true },
  });
  if (!order) {
    return { ok: false, message: "Order not found." };
  }

  try {
    const session = await createPaymentSessionForOrder(order.id, user.id);
    if (session.alreadyPaid) {
      return {
        ok: true,
        message: "Payment already received!",
        data: { orderNumber: session.orderNumber, paymentSessionId: null, alreadyPaid: true },
      };
    }
    return {
      ok: true,
      message: "Opening secure payment…",
      data: {
        orderNumber: session.orderNumber,
        paymentSessionId: session.paymentSessionId,
        alreadyPaid: false,
      },
    };
  } catch (error) {
    console.error("[retryPaymentAction] failed", error);
    return {
      ok: false,
      message:
        error instanceof CashfreeError || error instanceof Error
          ? error.message
          : "We couldn't start the payment. Please try again.",
    };
  }
}
