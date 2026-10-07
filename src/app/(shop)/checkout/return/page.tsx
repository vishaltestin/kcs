import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { verifyCashfreePayment } from "@/lib/cashfree";
import { confirmOrderPayment } from "@/lib/order-payments";

export const metadata: Metadata = {
  title: "Verifying Payment",
};

export const dynamic = "force-dynamic";

/**
 * Cashfree return URL — the customer lands here after every payment attempt
 * (`/checkout/return?order_id=…`). Never trusts the redirect itself: the
 * order is confirmed only after `verifyCashfreePayment` passes, and the
 * webhook running the same check makes this page idempotent.
 *
 * This page always redirects — the shop `loading.tsx` skeleton covers the
 * 1–2 seconds of verification.
 */
export default async function CheckoutReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { order_id: cashfreeOrderId } = await searchParams;
  const user = await requireUser("/cart");

  if (!cashfreeOrderId) redirect("/cart");

  const order = await db.order.findFirst({
    where: { cashfreeOrderId, userId: user.id },
    select: { id: true, orderNumber: true, paymentStatus: true, status: true },
  });
  if (!order) redirect("/cart");
  if (order.paymentStatus === "PAID") redirect(`/order-success/${order.orderNumber}`);
  if (order.status === "CANCELLED") redirect(`/payment-failed/${order.orderNumber}?reason=cancelled`);

  // Cashfree can redirect the browser a few seconds before the order flips
  // to PAID (async settlement / replica lag) — poll briefly before giving
  // up, so a paid order doesn't land on the failed page.
  let verified: Awaited<ReturnType<typeof verifyCashfreePayment>> | null = null;
  try {
    for (let attempt = 0; attempt < 4; attempt++) {
      if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 3000));
      verified = await verifyCashfreePayment(cashfreeOrderId);
      if (verified.paid) break;
    }
  } catch (error) {
    console.error("[checkout-return] verify failed", cashfreeOrderId, error);
    redirect(`/payment-failed/${order.orderNumber}?reason=verify`);
  }

  if (!verified?.paid) {
    // Failed, dropped or still pending at the gateway — the order stays
    // as-is and the customer retries from the failed page.
    console.warn("[checkout-return] order not paid after retries", cashfreeOrderId);
    redirect(`/payment-failed/${order.orderNumber}?reason=incomplete`);
  }

  try {
    await confirmOrderPayment(order.id, { cfPaymentId: verified.cfPaymentId });
  } catch (error) {
    console.error("[checkout-return] confirm failed", cashfreeOrderId, error);
    redirect(`/payment-failed/${order.orderNumber}?reason=confirm`);
  }

  redirect(`/order-success/${order.orderNumber}`);
}
