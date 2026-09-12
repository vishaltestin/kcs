"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { limitKey, rateLimit } from "@/lib/rate-limit";
import { checkoutSchema } from "@/lib/validations/shop";
import { generateOrderNumber } from "@/lib/utils";
import { getShippingConfig, getStoreSettings } from "@/lib/queries/shipping";
import { quoteShipping } from "@/lib/shipping";
import { resolveVariantTiers } from "@/lib/variants";
import { resolvePlaceOfSupply, splitInclusive, summariseTax } from "@/lib/tax";
import { allocateInvoiceNumber } from "@/lib/invoice";
import type { ActionResult } from "@/types";
import { str } from "@/lib/form";

/**
 * Order placement. Prices, stock, weights, shipping and GST are ALL recomputed
 * server-side from the database — client-supplied amounts are never trusted.
 *
 * Flow: validate → load products/variants → price each line from its tier
 * table → quote shipping (zone × chargeable weight) → carve GST out of the
 * inclusive totals → create order + items, decrement stock and allocate a
 * sequential invoice number in one transaction.
 */

type Line = {
  productId: string;
  variantId: string | null;
  name: string;
  variantLabel: string | null;
  sku: string | null;
  image: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  hsnCode: string | null;
  gstRate: number;
  taxAmount: number;
  weightGrams: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  stock: number;
};

export async function placeOrderAction(
  _prev: ActionResult<{ orderNumber: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ orderNumber: string }>> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, message: "Please sign in to place an order." };
  }

  const allowed = rateLimit(await limitKey("checkout"), 5, 60_000);
  if (!allowed) {
    return { ok: false, message: "Too many attempts. Please try again shortly." };
  }

  let items: { productId: string; variantId?: string | null; quantity: number }[];
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]")) as typeof items;
  } catch {
    return { ok: false, message: "Your cart could not be read. Please refresh and try again." };
  }

  const parsed = checkoutSchema.safeParse({
    customerName: str(formData.get("customerName")),
    customerEmail: str(formData.get("customerEmail")),
    customerPhone: str(formData.get("customerPhone")),
    companyName: str(formData.get("companyName")),
    gstNo: str(formData.get("gstNo")),
    billingAddress: str(formData.get("billingAddress")),
    billingCity: str(formData.get("billingCity")),
    billingState: str(formData.get("billingState")),
    billingPincode: str(formData.get("billingPincode")),
    sameAsBilling: str(formData.get("sameAsBilling")) === "true",
    shippingAddress: str(formData.get("shippingAddress")),
    shippingCity: str(formData.get("shippingCity")),
    shippingState: str(formData.get("shippingState")),
    shippingPincode: str(formData.get("shippingPincode")),
    notes: str(formData.get("notes")),
    items,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please complete the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  // Merge duplicate lines (same product + variant) so stock checks compare like with like.
  const merged = new Map<string, { productId: string; variantId: string | null; quantity: number }>();
  for (const item of data.items) {
    const variantId = item.variantId ?? null;
    const key = `${item.productId}:${variantId ?? ""}`;
    const prev = merged.get(key);
    merged.set(key, { productId: item.productId, variantId, quantity: (prev?.quantity ?? 0) + item.quantity });
  }
  const requested = [...merged.values()];

  const products = await db.product.findMany({
    where: { id: { in: requested.map((i) => i.productId) }, isActive: true },
    include: { prices: true, variants: { include: { prices: true } } },
  });

  if (new Set(requested.map((r) => r.productId)).size !== products.length) {
    return { ok: false, message: "Some items in your cart are no longer available." };
  }

  const lines: Line[] = [];

  for (const item of requested) {
    const product = products.find((p) => p.id === item.productId)!;
    if (product.pricingMode === "ENQUIRY") {
      return {
        ok: false,
        message: `"${product.name}" is quoted on request and can't be ordered online — please request a quote instead.`,
      };
    }

    const variant = item.variantId ? product.variants.find((v) => v.id === item.variantId && v.isActive) : undefined;
    if (product.hasVariants && product.variants.length > 0 && !variant) {
      return {
        ok: false,
        message: `Please choose a colour / size for "${product.name}" before checking out.`,
      };
    }

    // Variants price from the product tiers ± adjustment (shared) or their own table (custom).
    const tierSource = variant ? resolveVariantTiers(product.variantPricing, product.prices, variant) : product.prices;
    const tiers = [...tierSource].sort((a, b) => b.minQuantity - a.minQuantity);
    const tier = tiers.find((t) => item.quantity >= t.minQuantity) ?? tiers[tiers.length - 1];
    const fallback = variant ? Number(variant.basePrice ?? 0) : Number(product.basePrice ?? 0);
    const unitPrice = tier ? Number(tier.price) : fallback;
    const label = variant ? `${product.name} (${variant.label})` : product.name;
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return {
        ok: false,
        message: `"${label}" is available on enquiry only. Please remove it from your cart or contact us for a quote.`,
      };
    }

    const minQty = product.pricingMode === "SINGLE" ? 1 : tiers.length > 0 ? Math.max(1, tiers[tiers.length - 1].minQuantity) : 1;
    if (item.quantity < minQty) {
      return { ok: false, message: `"${label}" has a minimum order quantity of ${minQty} pcs.` };
    }

    const stock = variant ? variant.stock : product.stock;
    if (stock > 0 && item.quantity > stock) {
      return {
        ok: false,
        message: `Only ${stock} pcs of "${label}" are in stock right now. Reduce the quantity or enquire for a larger run.`,
      };
    }

    const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;
    const gstRate = Number(product.gstRate ?? 18);
    lines.push({
      productId: product.id,
      variantId: variant?.id ?? null,
      name: product.name,
      variantLabel: variant?.label ?? null,
      sku: variant?.sku ?? product.sku ?? null,
      image: variant?.image || product.image,
      unitPrice,
      quantity: item.quantity,
      lineTotal,
      hsnCode: product.hsnCode ?? null,
      gstRate,
      taxAmount: splitInclusive(lineTotal, gstRate).tax,
      weightGrams: variant?.weightGrams ?? product.weightGrams,
      lengthCm: Number(variant?.lengthCm ?? product.lengthCm),
      widthCm: Number(variant?.widthCm ?? product.widthCm),
      heightCm: Number(variant?.heightCm ?? product.heightCm),
      stock,
    });
  }

  const subtotal = Math.round(lines.reduce((sum, line) => sum + line.lineTotal, 0) * 100) / 100;

  const shippingAddress = data.sameAsBilling ? data.billingAddress : data.shippingAddress || data.billingAddress;
  const shippingCity = data.sameAsBilling ? data.billingCity : data.shippingCity || data.billingCity;
  const shippingState = data.sameAsBilling ? data.billingState : data.shippingState || data.billingState;
  const shippingPincode = data.sameAsBilling ? data.billingPincode : data.shippingPincode || data.billingPincode;

  // Shipping: zone from the delivery state × chargeable (actual vs volumetric) weight.
  const [shippingConfig, settings] = await Promise.all([getShippingConfig(), getStoreSettings()]);
  const quote = quoteShipping(
    lines.map((l) => ({ quantity: l.quantity, weightGrams: l.weightGrams, lengthCm: l.lengthCm, widthCm: l.widthCm, heightCm: l.heightCm })),
    shippingState,
    subtotal,
    shippingConfig,
  );
  const shipping = quote.amount;
  const total = Math.round((subtotal + shipping) * 100) / 100;

  // GST: place of supply from the buyer's GSTIN (or billing state); intra-state
  // with the seller → CGST + SGST, otherwise IGST.
  const placeOfSupply = resolvePlaceOfSupply(data.gstNo, data.billingState);
  const interState = !!placeOfSupply && placeOfSupply !== settings.sellerStateCode;
  const tax = summariseTax(
    lines.map((l) => ({ lineTotal: l.lineTotal, gstRate: l.gstRate })),
    interState,
    shipping,
  );

  const userId = user.id;
  const createOrder = (orderNumber: string) =>
    db.$transaction(async (tx) => {
      const invoiceNumber = await allocateInvoiceNumber(tx);
      const created = await tx.order.create({
        select: { orderNumber: true },
        data: {
          orderNumber,
          userId,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          companyName: data.companyName || null,
          gstNo: data.gstNo ? data.gstNo.toUpperCase() : null,
          billingAddress: data.billingAddress,
          billingCity: data.billingCity,
          billingState: data.billingState,
          billingPincode: data.billingPincode,
          shippingAddress,
          shippingCity,
          shippingState,
          shippingPincode,
          subtotal,
          shipping,
          total,
          notes: data.notes || null,
          taxableAmount: tax.taxableAmount,
          cgst: tax.cgst,
          sgst: tax.sgst,
          igst: tax.igst,
          placeOfSupply,
          shippingZone: quote.zone?.name ?? null,
          chargeableWeight: quote.chargeableWeight,
          shippingMethod: quote.method,
          invoiceNumber,
          invoicedAt: new Date(),
          items: {
            create: lines.map((line) => ({
              productId: line.productId,
              variantId: line.variantId,
              name: line.name,
              variantLabel: line.variantLabel,
              sku: line.sku,
              image: line.image,
              unitPrice: line.unitPrice,
              quantity: line.quantity,
              lineTotal: line.lineTotal,
              hsnCode: line.hsnCode,
              gstRate: line.gstRate,
              taxAmount: line.taxAmount,
              weightGrams: line.weightGrams,
            })),
          },
        },
      });

      // Decrement stock where it is tracked (stock 0 = not tracked / made to order).
      for (const line of lines) {
        if (line.stock <= 0) continue;
        if (line.variantId) {
          await tx.productVariant.update({
            where: { id: line.variantId },
            data: { stock: { decrement: line.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: line.productId },
            data: { stock: { decrement: line.quantity } },
          });
        }
      }
      return created;
    });

  // `orderNumber` is @unique with a short random suffix; on the rare
  // collision (P2002) retry with a fresh number instead of surfacing a 500.
  let order: { orderNumber: string } | null = null;
  for (let attempt = 0; attempt < 3 && !order; attempt++) {
    try {
      order = await createOrder(generateOrderNumber());
    } catch (error) {
      const isUniqueViolation =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "P2002";
      if (!isUniqueViolation || attempt === 2) {
        console.error("[placeOrderAction] order create failed", error);
        return {
          ok: false,
          message: "We couldn't place your order right now. Please try again in a moment.",
        };
      }
    }
  }
  if (!order) {
    return {
      ok: false,
      message: "We couldn't place your order right now. Please try again in a moment.",
    };
  }

  return {
    ok: true,
    message: "Order placed successfully!",
    data: { orderNumber: order.orderNumber },
  };
}
