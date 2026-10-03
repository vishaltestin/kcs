import type { Prisma } from "@prisma/client";

/**
 * Inventory reservation.
 *
 * The old checkout checked stock *before* opening the transaction and then
 * decremented unconditionally, so two concurrent buyers could both take the
 * last units (stock went negative). Reservation now happens inside the order
 * transaction as a conditional `UPDATE … WHERE stock >= qty`:
 *
 *   • rows are locked in a fixed order (sorted id) so concurrent checkouts
 *     cannot deadlock each other;
 *   • a zero-row update means someone else took the units — the caller gets a
 *     StockError and the whole transaction rolls back;
 *   • only products/variants with `trackStock = true` are touched, and what
 *     was actually reserved is returned so it can be recorded on the order
 *     line (`OrderItem.stockReserved`) and restored exactly once on cancel.
 */

export class StockError extends Error {
  constructor(
    message: string,
    /** Human-readable item label, when known. */
    readonly label?: string,
  ) {
    super(message);
    this.name = "StockError";
  }
}

export type StockLine = {
  /** Product being reserved. */
  productId: string;
  /** Variant when the product sells by variant. */
  variantId: string | null;
  /** Units requested. */
  quantity: number;
  /** Line label for error messages ("Gift box (Red / L)"). */
  label: string;
};

/** Stable key for a line, used to map reservations back to order lines. */
export function stockLineKey(productId: string, variantId: string | null): string {
  return variantId ? `${productId}:${variantId}` : productId;
}

type Target = {
  productId: string;
  variantId: string | null;
  quantity: number;
  label: string;
  /** Sort key — variant id when present, else product id. */
  lockKey: string;
};

/**
 * Reserves `quantity` units for every line that tracks stock.
 *
 * @returns Map of `stockLineKey` → units reserved, for lines that reserved
 *          anything (untracked lines are absent). Store this on the order
 *          items so cancellation can restore it.
 * @throws StockError when a tracked line no longer has enough stock.
 */
export async function reserveStock(
  tx: Prisma.TransactionClient,
  lines: StockLine[],
): Promise<Map<string, number>> {
  const targets: Target[] = lines
    .filter((line) => line.quantity > 0)
    .map((line) => ({
      ...line,
      lockKey: line.variantId ?? line.productId,
    }));

  // Fixed lock order across concurrent transactions.
  targets.sort((a, b) => (a.lockKey < b.lockKey ? -1 : a.lockKey > b.lockKey ? 1 : 0));

  const reserved = new Map<string, number>();

  for (const target of targets) {
    if (target.variantId) {
      const updated = await tx.productVariant.updateMany({
        where: { id: target.variantId, trackStock: true, stock: { gte: target.quantity } },
        data: { stock: { decrement: target.quantity } },
      });
      if (updated.count === 0) {
        await assertUnavailable(tx, target, "variant");
        continue; // untracked variant — nothing reserved
      }
    } else {
      const updated = await tx.product.updateMany({
        where: { id: target.productId, trackStock: true, stock: { gte: target.quantity } },
        data: { stock: { decrement: target.quantity } },
      });
      if (updated.count === 0) {
        await assertUnavailable(tx, target, "product");
        continue; // untracked product — nothing reserved
      }
    }
    reserved.set(stockLineKey(target.productId, target.variantId), target.quantity);
  }

  return reserved;
}

/**
 * A zero-row conditional update means either "not tracked" (fine, nothing to
 * reserve) or "not enough stock" (fail). Only re-reads in the zero-row case.
 */
async function assertUnavailable(
  tx: Prisma.TransactionClient,
  target: Target,
  kind: "product" | "variant",
): Promise<void> {
  const row =
    kind === "variant"
      ? await tx.productVariant.findUnique({
          where: { id: target.variantId! },
          select: { trackStock: true, stock: true },
        })
      : await tx.product.findUnique({
          where: { id: target.productId },
          select: { trackStock: true, stock: true },
        });

  if (!row || !row.trackStock) return; // untracked — always purchasable

  throw new StockError(
    row.stock <= 0
      ? `"${target.label}" sold out while you were checking out. Please remove it or reduce the quantity.`
      : `Only ${row.stock} pcs of "${target.label}" are left — someone else just ordered. Reduce the quantity and try again.`,
    target.label,
  );
}

export type RestorableItem = {
  productId: string | null;
  variantId: string | null;
  stockReserved: number;
};

/**
 * Returns reserved units to stock. Call inside the transaction that cancels
 * the order; the caller must zero `stockReserved` in the same transaction so
 * a second cancellation cannot double-restore.
 */
export async function restoreStock(
  tx: Prisma.TransactionClient,
  items: RestorableItem[],
): Promise<void> {
  const targets = items
    .filter((item) => item.stockReserved > 0)
    .sort((a, b) => {
      const ka = a.variantId ?? a.productId ?? "";
      const kb = b.variantId ?? b.productId ?? "";
      return ka < kb ? -1 : ka > kb ? 1 : 0;
    });

  for (const item of targets) {
    if (item.variantId) {
      await tx.productVariant.updateMany({
        where: { id: item.variantId },
        data: { stock: { increment: item.stockReserved } },
      });
    } else if (item.productId) {
      await tx.product.updateMany({
        where: { id: item.productId },
        data: { stock: { increment: item.stockReserved } },
      });
    }
  }
}
