import type { Prisma } from "@prisma/client";

import { round2 } from "@/lib/tax";

/**
 * Multi-vendor order splitting.
 *
 * A customer order (the *parent*) is split into one *sub-order* per vendor at
 * checkout. The parent keeps the customer-facing identity (order number,
 * invoice, aggregate totals); each sub-order belongs to one vendor, carries
 * that vendor's lines, a pro-rata share of shipping and its own GST carve-out
 * (place of supply is compared against the vendor's state code).
 *
 * Legacy orders placed before the multi-vendor migration have no sub-orders —
 * their items live directly on the order and every read path falls back to
 * that shape.
 */

export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

/** Fulfilment progress; CANCELLED is handled separately. */
const STATUS_RANK: Record<OrderStatus, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  SHIPPED: 2,
  DELIVERED: 3,
  CANCELLED: 99,
};

/**
 * Derive the parent order's status from its sub-orders. The parent reflects
 * the slowest active leg (an order is only "delivered" once every vendor has
 * delivered). All-cancelled collapses to CANCELLED; cancelled legs are
 * otherwise ignored.
 */
export function deriveParentStatus(statuses: OrderStatus[]): OrderStatus {
  if (statuses.length === 0) return "PENDING";
  if (statuses.every((s) => s === "CANCELLED")) return "CANCELLED";
  const active = statuses.filter((s) => s !== "CANCELLED");
  return active.reduce((min, s) => (STATUS_RANK[s] < STATUS_RANK[min] ? s : min), active[0]);
}

/**
 * Re-derive and persist a parent order's status from its sub-orders. Call
 * inside the same transaction that changed a sub-order.
 */
export async function syncParentOrderStatus(
  tx: Prisma.TransactionClient,
  parentId: string,
): Promise<void> {
  const subs = await tx.order.findMany({
    where: { parentId },
    select: { status: true },
  });
  if (subs.length === 0) return;

  const status = deriveParentStatus(subs.map((s) => s.status as OrderStatus));
  const parent = await tx.order.findUnique({
    where: { id: parentId },
    select: { status: true, shippedAt: true, deliveredAt: true },
  });
  if (!parent) return;

  await tx.order.update({
    where: { id: parentId },
    data: {
      status,
      ...(status === "SHIPPED" && !parent.shippedAt ? { shippedAt: new Date() } : {}),
      ...(status === "DELIVERED" && !parent.deliveredAt ? { deliveredAt: new Date() } : {}),
    },
  });
}

/**
 * Split an order-level amount (shipping) across groups proportionally to
 * their subtotals, in whole paisa, using largest-remainder allocation so the
 * shares always sum exactly to `total`.
 */
export function allocateProRata(
  shares: { key: string; amount: number }[],
  total: number,
): Map<string, number> {
  const result = new Map<string, number>();
  const subtotal = shares.reduce((sum, s) => sum + Math.max(0, s.amount), 0);
  if (shares.length === 0) return result;
  if (subtotal <= 0 || total <= 0) {
    for (const share of shares) result.set(share.key, 0);
    return result;
  }

  const totalPaise = Math.round(total * 100);
  const raw = shares.map((s) => ({ key: s.key, value: (Math.max(0, s.amount) / subtotal) * totalPaise }));
  const floored = raw.map((r) => ({ key: r.key, base: Math.floor(r.value), remainder: r.value - Math.floor(r.value) }));
  let leftover = totalPaise - floored.reduce((sum, f) => sum + f.base, 0);

  for (const f of [...floored].sort((a, b) => b.remainder - a.remainder)) {
    if (leftover <= 0) break;
    f.base += 1;
    leftover -= 1;
  }
  for (const f of floored) result.set(f.key, f.base / 100);
  return result;
}

/** Sub-order fulfilment reference derived from the parent's order number. */
export function generateSubOrderNumber(parentOrderNumber: string, index: number): string {
  return `${parentOrderNumber}-V${index + 1}`;
}

/** Rounding-safe sum of currency values. */
export function sumCurrency(values: number[]): number {
  return round2(values.reduce((sum, v) => sum + v, 0));
}
