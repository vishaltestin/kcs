import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { verifyCashfreePayment, verifyWebhookSignature } from "@/lib/cashfree";
import { confirmOrderPayment, markOrderPaymentFailed } from "@/lib/order-payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/payments/cashfree/webhook
 * Cashfree server-to-server notifications (the return-URL redirect can be
 * skipped when a customer closes the tab mid-payment, so this is the safety
 * net that still confirms paid orders).
 *
 * Trust model: the HMAC signature is verified first; a SUCCESS event is then
 * re-verified against Cashfree's API before anything is fulfilled. A 5xx
 * asks Cashfree to retry delivery later.
 */
export async function POST(req: Request) {
  const raw = await req.text();

  if (!verifyWebhookSignature(raw, req.headers.get("x-webhook-signature"), req.headers.get("x-webhook-timestamp"))) {
    console.warn("[cashfree-webhook] rejected: bad signature");
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: {
    type?: string;
    data?: {
      order?: { order_id?: string };
      payment?: { cf_payment_id?: string; payment_status?: string };
    };
  };
  try {
    event = JSON.parse(raw) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const cashfreeOrderId = event.data?.order?.order_id;
  if (!cashfreeOrderId) return NextResponse.json({ received: true });

  switch (event.type) {
    case "PAYMENT_SUCCESS_WEBHOOK": {
      const order = await db.order.findFirst({
        where: { cashfreeOrderId, parentId: null },
        select: { id: true, paymentStatus: true, status: true },
      });
      // Unknown / cancelled / already-paid → acknowledge, nothing to do.
      if (!order || order.status === "CANCELLED" || order.paymentStatus === "PAID") {
        break;
      }
      try {
        const verified = await verifyCashfreePayment(cashfreeOrderId);
        if (!verified.paid) {
          // Eventual consistency on Cashfree's side — ask for a redelivery.
          console.warn("[cashfree-webhook] success event but order not PAID yet", cashfreeOrderId);
          return NextResponse.json({ error: "Payment not confirmed yet." }, { status: 503 });
        }
        await confirmOrderPayment(order.id, { cfPaymentId: verified.cfPaymentId });
      } catch (error) {
        console.error("[cashfree-webhook] confirm failed", cashfreeOrderId, error);
        return NextResponse.json({ error: "Confirmation failed." }, { status: 500 });
      }
      break;
    }
    case "PAYMENT_FAILED_WEBHOOK": {
      await markOrderPaymentFailed(cashfreeOrderId);
      break;
    }
    // The customer abandoned the gateway without paying — the order stays
    // PENDING so they can retry from their orders page.
    case "PAYMENT_USER_DROPPED_WEBHOOK":
    default: {
      break;
    }
  }

  return NextResponse.json({ received: true });
}
