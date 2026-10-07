import "server-only";

import { db } from "@/lib/db";
import {
  CashfreeError,
  createCashfreeOrder,
  getCashfreeOrder,
  terminateCashfreeOrder,
  verifyCashfreePayment,
} from "@/lib/cashfree";
import { allocateInvoiceNumber } from "@/lib/invoice";
import { reserveStock, StockError, stockLineKey } from "@/lib/inventory";

/**
 * Payment-state transitions for online (Cashfree) orders.
 *
 * The core invariant: a local order is just a *quote* until money arrives.
 * `confirmOrderPayment` is the single funnel through which every successful
 * payment flows (return page, retry action, webhook) — it reserves stock,
 * issues the invoice and flips PENDING → PAID exactly once, so concurrent
 * confirmations are safe.
 */

export interface ConfirmResult {
  /** True when the order was already PAID (webhook + return page raced). */
  alreadyPaid: boolean;
  /**
   * Non-null when payment succeeded but stock ran out in between — the money
   * is recorded and the team follows up (alternatives or refund) instead of
   * failing the checkout.
   */
  stockShortage: string | null;
}

/** Internal sentinel: another confirmation won the race for this order. */
class ConcurrentConfirmError extends Error {
  constructor() {
    super("Order was confirmed concurrently.");
    this.name = "ConcurrentConfirmError";
  }
}

type ReservableItem = {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  label: string;
};

export async function confirmOrderPayment(
  orderId: string,
  payment: { cfPaymentId: string | null },
): Promise<ConfirmResult> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, paymentStatus: true, status: true },
  });
  if (!order) throw new Error("Order not found.");
  if (order.status === "CANCELLED") {
    throw new Error("This order was cancelled — please contact support about the payment.");
  }
  if (order.paymentStatus === "PAID") return { alreadyPaid: true, stockShortage: null };

  // Split orders carry their items on the sub-orders; legacy orders on self.
  const full = await db.order.findUnique({
    where: { id: orderId },
    select: {
      invoiceNumber: true,
      items: {
        select: {
          id: true,
          productId: true,
          variantId: true,
          quantity: true,
          name: true,
          variantLabel: true,
        },
      },
      subOrders: {
        select: {
          items: {
            select: {
              id: true,
              productId: true,
              variantId: true,
              quantity: true,
              name: true,
              variantLabel: true,
            },
          },
        },
      },
    },
  });
  if (!full) throw new Error("Order not found.");
  const snapshots = full.subOrders.length > 0 ? full.subOrders.flatMap((s) => s.items) : full.items;

  try {
    const items: ReservableItem[] = snapshots.map((item) => {
      const label = item.variantLabel ? `${item.name} (${item.variantLabel})` : item.name;
      // A product deleted between checkout and payment can't be reserved —
      // route through the shortage path (paid + flagged) instead of failing.
      if (!item.productId) {
        throw new StockError(`"${label}" is no longer available.`, label);
      }
      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        label,
      };
    });

    const now = new Date();
    await db.$transaction(async (tx) => {
      const invoiceNumber = full.invoiceNumber ?? (await allocateInvoiceNumber(tx));
      const reserved = await reserveStock(
        tx,
        items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          label: item.label,
        })),
      );

      // Claim the PENDING → PAID flip; a zero-row update means a concurrent
      // confirmation (webhook vs return page) already took it.
      const claimed = await tx.order.updateMany({
        where: { id: orderId, paymentStatus: { not: "PAID" } },
        data: {
          paymentStatus: "PAID",
          cfPaymentId: payment.cfPaymentId,
          paidAt: now,
          invoiceNumber,
          invoicedAt: now,
        },
      });
      if (claimed.count === 0) throw new ConcurrentConfirmError();

      for (const item of items) {
        const qty = reserved.get(stockLineKey(item.productId, item.variantId)) ?? 0;
        if (qty > 0) {
          await tx.orderItem.update({ where: { id: item.id }, data: { stockReserved: qty } });
        }
      }
      await tx.order.updateMany({ where: { parentId: orderId }, data: { paymentStatus: "PAID" } });
    });
    return { alreadyPaid: false, stockShortage: null };
  } catch (error) {
    if (error instanceof ConcurrentConfirmError) return { alreadyPaid: true, stockShortage: null };
    if (error instanceof StockError) {
      // Real money arrived — record it and flag the shortage on the order
      // for the fulfilment team rather than failing the payment.
      const shortage = error.message;
      const claimed = await db.$transaction(async (tx) => {
        const current = await tx.order.findUnique({
          where: { id: orderId },
          select: { notes: true, invoiceNumber: true, paymentStatus: true },
        });
        if (!current || current.paymentStatus === "PAID") return false;
        const invoiceNumber = current.invoiceNumber ?? (await allocateInvoiceNumber(tx));
        const stamp =
          `[Online payment received — stock short: ${shortage} ` +
          `Team to arrange an alternative or a refund.]`;
        await tx.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: "PAID",
            cfPaymentId: payment.cfPaymentId,
            paidAt: new Date(),
            invoiceNumber,
            invoicedAt: new Date(),
            notes: current.notes ? `${current.notes}\n${stamp}` : stamp,
          },
        });
        await tx.order.updateMany({ where: { parentId: orderId }, data: { paymentStatus: "PAID" } });
        return true;
      });
      return { alreadyPaid: !claimed, stockShortage: claimed ? shortage : null };
    }
    throw error;
  }
}

/** Records a definitive gateway failure; the customer can still retry. */
export async function markOrderPaymentFailed(cashfreeOrderId: string): Promise<boolean> {
  const order = await db.order.findFirst({
    where: { cashfreeOrderId, parentId: null },
    select: { id: true, paymentStatus: true },
  });
  if (!order || order.paymentStatus !== "PENDING") return false;
  await db.$transaction(async (tx) => {
    await tx.order.updateMany({
      where: { id: order.id, paymentStatus: "PENDING" },
      data: { paymentStatus: "FAILED" },
    });
    await tx.order.updateMany({
      where: { parentId: order.id, paymentStatus: "PENDING" },
      data: { paymentStatus: "FAILED" },
    });
  });
  return true;
}

export interface PaymentSessionResult {
  orderNumber: string;
  paymentSessionId: string | null;
  alreadyPaid: boolean;
}

/**
 * Mints a fresh Cashfree order id + single-use session for an unpaid order.
 *
 * Cashfree ids are single-attempt (re-creating one returns 409), so the id
 * rotates on EVERY attempt while the local order number stays stable.
 *
 * Verify-first: if the money already arrived (webhook won the race, or the
 * customer paid and closed the tab before the return URL ran), the order is
 * confirmed locally and no session is needed — retrying is therefore always
 * safe and can never double-charge.
 */
export async function createPaymentSessionForOrder(
  orderId: string,
  userId: string,
): Promise<PaymentSessionResult> {
  const order = await db.order.findFirst({
    where: { id: orderId, userId, parentId: null },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      cashfreeOrderId: true,
      total: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
    },
  });
  if (!order) throw new Error("Order not found.");
  if (order.status === "CANCELLED") throw new Error("This order was cancelled.");
  if (order.paymentStatus === "PAID") {
    return { orderNumber: order.orderNumber, paymentSessionId: null, alreadyPaid: true };
  }

  let cfOrderId = order.cashfreeOrderId ?? order.orderNumber;
  if (!order.cashfreeOrderId) {
    await db.order.update({ where: { id: orderId }, data: { cashfreeOrderId: cfOrderId } });
  }

  try {
    const remote = await getCashfreeOrder(cfOrderId);
    if (remote.order_status === "PAID") {
      const verified = await verifyCashfreePayment(cfOrderId);
      if (verified.paid) {
        await confirmOrderPayment(orderId, { cfPaymentId: verified.cfPaymentId });
        return { orderNumber: order.orderNumber, paymentSessionId: null, alreadyPaid: true };
      }
      // PAID at Cashfree but no SUCCESS payment found — never mint a new
      // session against money that may already exist. The webhook confirms
      // the order once Cashfree is consistent; support can reconcile via
      // the cf_order_id in the meantime.
      throw new CashfreeError(
        "We received your payment and are confirming it — please check back in a few minutes.",
      );
    }
    // Any existing remote id (ACTIVE, EXPIRED, TERMINATED, …) is spent:
    // Cashfree answers a re-created id with 409 order_already_exists, so
    // every attempt rotates to a fresh id. The old id is terminated
    // best-effort so a stale checkout tab can't pay against it.
    await terminateCashfreeOrder(cfOrderId);
    cfOrderId = await rotateCashfreeOrderId(orderId, order.orderNumber);
  } catch (error) {
    // 404 → never reached Cashfree (gateway was down at checkout); create
    // below with the stored id. Anything else is a real failure.
    if (!(error instanceof CashfreeError) || error.status !== 404) throw error;
  }

  const session = await createCashfreeOrder({
    orderId: cfOrderId,
    amount: Number(order.total),
    customerId: userId,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
  });

  // A retry after a FAILED attempt returns the order to PENDING.
  if (order.paymentStatus === "FAILED") {
    await db.order.updateMany({
      where: { OR: [{ id: orderId }, { parentId: orderId }] },
      data: { paymentStatus: "PENDING" },
    });
  }

  return { orderNumber: order.orderNumber, paymentSessionId: session.paymentSessionId, alreadyPaid: false };
}

/**
 * Cashfree order ids allow [A-Za-z0-9_-], 3–45 chars. The `-R<time>`
 * suffix keeps the retry traceable back to the local order number.
 */
async function rotateCashfreeOrderId(orderId: string, orderNumber: string): Promise<string> {
  const next = `${orderNumber}-R${Date.now().toString(36).toUpperCase()}`.slice(0, 45);
  try {
    await db.order.update({ where: { id: orderId }, data: { cashfreeOrderId: next } });
    return next;
  } catch {
    const fallback = `${orderNumber}-R${Math.random().toString(36).slice(2, 8).toUpperCase()}`.slice(0, 45);
    await db.order.update({ where: { id: orderId }, data: { cashfreeOrderId: fallback } });
    return fallback;
  }
}
