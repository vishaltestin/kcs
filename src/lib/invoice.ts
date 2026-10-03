import "server-only";

import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { istParts } from "@/lib/dates";

/**
 * Sequential GST-compliant invoice numbers: `<prefix>/<FY>/<000123>`.
 * The counter lives on the single StoreSetting row and is bumped inside a
 * transaction so two simultaneous orders never share a number.
 *
 * Indian financial year runs April → March, e.g. "25-26", evaluated in IST —
 * the server's local timezone must not decide which year an invoice belongs
 * to (a UTC server would otherwise roll over at 05:30 IST on 1 April).
 */
export function financialYear(date = new Date()): string {
  const { year, month } = istParts(date);
  const startYear = month >= 4 ? year : year - 1;
  return `${String(startYear).slice(-2)}-${String(startYear + 1).slice(-2)}`;
}

export async function allocateInvoiceNumber(tx: Prisma.TransactionClient, date = new Date()): Promise<string> {
  const settings = await tx.storeSetting.upsert({
    where: { id: 1 },
    update: { invoiceCounter: { increment: 1 } },
    create: { id: 1, invoiceCounter: 1 },
    select: { invoicePrefix: true, invoiceCounter: true },
  });
  return `${settings.invoicePrefix}/${financialYear(date)}/${String(settings.invoiceCounter).padStart(6, "0")}`;
}

/** Ensure legacy orders (placed before invoicing existed) get a number on first download. */
export async function ensureInvoiceNumber(orderId: string): Promise<string> {
  const existing = await db.order.findUnique({ where: { id: orderId }, select: { invoiceNumber: true } });
  if (existing?.invoiceNumber) return existing.invoiceNumber;
  return db.$transaction(async (tx) => {
    const number = await allocateInvoiceNumber(tx);
    await tx.order.update({ where: { id: orderId }, data: { invoiceNumber: number, invoicedAt: new Date() } });
    return number;
  });
}
