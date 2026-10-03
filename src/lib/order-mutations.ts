import type { Prisma } from "@prisma/client";

import { restoreStock, StockError } from "@/lib/inventory";
import { syncParentOrderStatus, type OrderStatus } from "@/lib/sub-orders";

/**
 * The single transactional path for every order status change (admin and
 * vendor alike).
 *
 * Before this existed each call site wrote `status` directly: an admin could
 * set any status to any other (including cancelled → delivered, reopening a
 * cancelled order), a vendor could mark an unshipped order delivered, and
 * concurrent sub-order updates could leave the parent stale.
 *
 * Now:
 *   • only the transitions below are allowed — everything else is refused
 *     with a message the UI can show as-is;
 *   • a parent order's status is always derived from its sub-orders and can
 *     never be set by hand;
 *   • cancelling an unshipped order restores its reserved stock exactly once;
 *   • the parent row is re-derived inside the same transaction.
 */

export type { OrderStatus };

/** Allowed next states per current state. DELIVERED and CANCELLED are terminal. */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

/** Cancelling before dispatch gives the reserved units back to the catalogue. */
const STOCK_RESTORING_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED"];

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Human-readable refusal used when a transition is not allowed. */
export function transitionError(from: OrderStatus, to: OrderStatus): string {
  if (from === to) return `This order is already ${from.toLowerCase()}.`;
  if (from === "CANCELLED") return "This order was cancelled and can no longer change status.";
  if (from === "DELIVERED") return "This order is delivered — its status is final.";
  if (to === "DELIVERED" && from !== "SHIPPED") {
    return "Only shipped orders can be marked delivered. Save the courier details and mark it shipped first.";
  }
  return `An order can't go from ${from.toLowerCase()} to ${to.toLowerCase()}.`;
}

export class OrderTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderTransitionError";
  }
}

type OrderRow = {
  id: string;
  status: OrderStatus;
  parentId: string | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
};

/**
 * Moves an order (parent or sub-order) to `to`.
 *
 * Must be called inside a transaction. The order row is locked by the
 * conditional update: we re-read it inside the transaction, and the update
 * itself carries the expected current status so two racing callers can't both
 * succeed.
 */
export async function transitionOrderStatus(
  tx: Prisma.TransactionClient,
  orderId: string,
  to: OrderStatus,
): Promise<{ from: OrderStatus; restored: number }> {
  const order = (await tx.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, parentId: true, shippedAt: true, deliveredAt: true },
  })) as OrderRow | null;

  if (!order) throw new OrderTransitionError("Order not found.");

  // Parent orders derive their status — they must never be set directly.
  const childCount = await tx.order.count({ where: { parentId: orderId } });
  if (childCount > 0) {
    throw new OrderTransitionError(
      "This order's status is derived from its vendor sub-orders — update those instead.",
    );
  }

  const from = order.status;
  if (!canTransition(from, to)) {
    throw new OrderTransitionError(transitionError(from, to));
  }

  // Optimistic guard: only the caller that saw `from` may move it.
  const updated = await tx.order.updateMany({
    where: { id: orderId, status: from },
    data: {
      status: to,
      ...(to === "SHIPPED" && !order.shippedAt ? { shippedAt: new Date() } : {}),
      ...(to === "DELIVERED" ? { deliveredAt: order.deliveredAt ?? new Date() } : {}),
    },
  });
  if (updated.count === 0) {
    throw new OrderTransitionError(
      "Another update changed this order at the same time. Refresh and try again.",
    );
  }

  let restored = 0;
  if (to === "CANCELLED" && STOCK_RESTORING_STATUSES.includes(from)) {
    restored = await restoreOrderStock(tx, orderId);
  }

  if (order.parentId) await syncParentOrderStatus(tx, order.parentId);

  return { from, restored };
}

/**
 * Returns reserved units for a cancelled order and marks them restored.
 * `stockReserved` is zeroed in the same transaction, so a second cancellation
 * can never double-restore.
 */
async function restoreOrderStock(tx: Prisma.TransactionClient, orderId: string): Promise<number> {
  const items = await tx.orderItem.findMany({
    where: { orderId, stockReserved: { gt: 0 } },
    select: { id: true, productId: true, variantId: true, stockReserved: true },
  });
  if (items.length === 0) return 0;

  await restoreStock(tx, items);
  await tx.orderItem.updateMany({
    where: { id: { in: items.map((item) => item.id) } },
    data: { stockReserved: 0 },
  });

  return items.reduce((sum, item) => sum + item.stockReserved, 0);
}

/** Maps inventory/transition failures onto a user-facing ActionResult. */
export function orderMutationMessage(error: unknown): string | null {
  if (error instanceof OrderTransitionError || error instanceof StockError) return error.message;
  return null;
}
