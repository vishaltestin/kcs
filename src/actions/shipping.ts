"use server";

import { z } from "zod";

import { getShippingConfig } from "@/lib/queries/shipping";
import { quoteShipping } from "@/lib/shipping";

/**
 * Live shipping estimate for the cart / checkout. Weights come from the
 * client's cart lines for responsiveness, but the order itself re-derives
 * them from the database in `placeOrderAction`.
 */

const lineSchema = z.object({
  quantity: z.number().int().min(1).max(100000),
  weightGrams: z.number().min(0).max(1_000_000),
  lengthCm: z.number().min(0).max(1000),
  widthCm: z.number().min(0).max(1000),
  heightCm: z.number().min(0).max(1000),
});

const inputSchema = z.object({
  lines: z.array(lineSchema).max(200),
  state: z.string().trim().max(60),
  subtotal: z.number().min(0),
});

export type ShippingEstimate = {
  amount: number;
  free: boolean;
  zoneName: string | null;
  etaDays: string | null;
  chargeableWeight: number;
  freeShippingThreshold: number;
  reason: "free-threshold" | "rate-card" | "no-weight" | "no-zone";
};

export async function estimateShippingAction(raw: unknown): Promise<ShippingEstimate | null> {
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) return null;
  const config = await getShippingConfig();
  const quote = quoteShipping(parsed.data.lines, parsed.data.state || null, parsed.data.subtotal, config);
  return {
    amount: quote.amount,
    free: quote.free,
    zoneName: quote.zone?.name ?? null,
    etaDays: quote.zone?.etaDays ?? null,
    chargeableWeight: quote.chargeableWeight,
    freeShippingThreshold: config.freeShippingThreshold,
    reason: quote.reason,
  };
}
