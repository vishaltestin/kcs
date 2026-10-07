"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { limitKey, rateLimit } from "@/lib/rate-limit";
import { checkoutSchema } from "@/lib/validations/shop";
import { generateOrderNumber } from "@/lib/utils";
import { getShippingConfig, getStoreSettings } from "@/lib/queries/shipping";
import { quoteShipping } from "@/lib/shipping";
import { resolveVariantTiers } from "@/lib/variants";
import { resolvePlaceOfSupply, splitInclusive, summariseTax, type TaxSummary } from "@/lib/tax";
import {
  allocateProRata,
  generateSubOrderNumber,
  sumCurrency,
} from "@/lib/sub-orders";
import { CashfreeError, createCashfreeOrder } from "@/lib/cashfree";
import { createPaymentSessionForOrder } from "@/lib/order-payments";
import type { ActionResult } from "@/types";
import { str } from "@/lib/form";

/**
 * Online-only checkout (Cashfree). Prices, stock, weights, shipping and GST
 * are ALL recomputed server-side from the database — client-supplied amounts
 * are never trusted.
 *
 * Flow: validate → load products/variants (+vendor) → price each line from its
 * tier table → quote shipping (zone × chargeable weight) → group lines by
 * vendor → create the parent order plus one sub-order per vendor as UNPAID →
 * mint a single-use Cashfree payment session for the browser to open.
 *
 * Stock is reserved and the invoice number allocated only after successful
 * payment (`confirmOrderPayment`), so an abandoned checkout never blocks
 * inventory or burns an invoice number.
 */

/** What the checkout form needs to hand off to the Cashfree SDK. */
export interface CheckoutSession {
  orderNumber: string;
  /** Null when the order is already paid (replay) — redirect to success. */
  paymentSessionId: string | null;
  alreadyPaid: boolean;
}

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
  /** Whether `stock` is a real count; false = made to order. */
  trackStock: boolean;
  vendorId: string;
};

/** Everything needed to persist one vendor's sub-order. */
type VendorGroup = {
  vendorId: string;
  vendorStateCode: string;
  lines: Line[];
  subtotal: number;
  shipping: number;
  total: number;
  weightGrams: number;
  tax: TaxSummary;
};

export async function placeOrderAction(
  _prev: ActionResult<CheckoutSession> | null,
  formData: FormData,
): Promise<ActionResult<CheckoutSession>> {
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
    include: {
      prices: true,
      variants: { include: { prices: true } },
      vendor: { select: { id: true, stateCode: true, status: true } },
    },
  });

  if (new Set(requested.map((r) => r.productId)).size !== products.length) {
    return { ok: false, message: "Some items in your cart are no longer available." };
  }

  const lines: Line[] = [];

  for (const item of requested) {
    const product = products.find((p) => p.id === item.productId)!;
    if (product.vendor.status !== "ACTIVE") {
      return {
        ok: false,
        message: `"${product.name}" is temporarily unavailable from its seller. Please remove it and try again.`,
      };
    }
    if (product.pricingMode === "ENQUIRY") {
      return {
        ok: false,
        message: `"${product.name}" is quoted on request and can't be ordered online — please request a quote instead.`,
      };
    }

    // A variant line only counts while the product actually sells by variant —
    // hiding variants in the admin must not keep pricing a stale variant table.
    const variant =
      product.hasVariants && item.variantId
        ? product.variants.find((v) => v.id === item.variantId && v.isActive)
        : undefined;
    const tracked = variant ? variant.trackStock : product.trackStock;
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

    // Pre-payment availability check only — the authoritative reservation
    // happens after successful payment (see confirmOrderPayment), when the
    // units are actually spoken for.
    const stock = variant ? variant.stock : product.stock;
    if (tracked && item.quantity > stock) {
      return {
        ok: false,
        message:
          stock <= 0
            ? `"${label}" just sold out. Reduce the quantity or enquire for a larger run.`
            : `Only ${stock} pcs of "${label}" are in stock right now. Reduce the quantity or enquire for a larger run.`,
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
      trackStock: tracked,
      vendorId: product.vendor.id,
    });
  }

  const subtotal = sumCurrency(lines.map((line) => line.lineTotal));

  const shippingAddress = data.sameAsBilling ? data.billingAddress : data.shippingAddress || data.billingAddress;
  const shippingCity = data.sameAsBilling ? data.billingCity : data.shippingCity || data.billingCity;
  const shippingState = data.sameAsBilling ? data.billingState : data.shippingState || data.billingState;
  const shippingPincode = data.sameAsBilling ? data.billingPincode : data.shippingPincode || data.billingPincode;

  // Shipping: zone from the delivery state × chargeable (actual vs volumetric)
  // weight, quoted once for the whole cart.
  const [shippingConfig, settings] = await Promise.all([getShippingConfig(), getStoreSettings()]);
  const quote = quoteShipping(
    lines.map((l) => ({ quantity: l.quantity, weightGrams: l.weightGrams, lengthCm: l.lengthCm, widthCm: l.widthCm, heightCm: l.heightCm })),
    shippingState,
    subtotal,
    shippingConfig,
  );
  // No rate card for this destination → refuse rather than shipping free.
  if (!quote.available) {
    return {
      ok: false,
      message: `We don't have a delivery rate for "${shippingState}" yet. Please contact us for a quote.`,
      fieldErrors: { shippingPincode: ["This destination isn't serviceable online yet."] },
    };
  }

  const shipping = quote.amount;
  const total = sumCurrency([subtotal, shipping]);

  // Place of supply comes from the buyer's GSTIN (or billing state). Each
  // vendor's sub-order compares it against that vendor's own state code.
  const placeOfSupply = resolvePlaceOfSupply(data.gstNo, data.billingState);

  // Group lines per vendor and give each group a pro-rata shipping share so
  // the split totals always add back up to the parent totals exactly.
  const byVendor = new Map<string, Line[]>();
  for (const line of lines) {
    const group = byVendor.get(line.vendorId) ?? [];
    group.push(line);
    byVendor.set(line.vendorId, group);
  }

  const vendorMeta = new Map(
    products.map((p) => [p.vendor.id, p.vendor.stateCode] as const),
  );
  const shippingShares = allocateProRata(
    [...byVendor.entries()].map(([vendorId, groupLines]) => ({
      key: vendorId,
      amount: sumCurrency(groupLines.map((l) => l.lineTotal)),
    })),
    shipping,
  );

  const groups: VendorGroup[] = [...byVendor.entries()]
    .sort(([a], [b]) => a.localeCompare(b)) // deterministic sub-order numbering
    .map(([vendorId, groupLines]) => {
      const groupSubtotal = sumCurrency(groupLines.map((l) => l.lineTotal));
      const groupShipping = shippingShares.get(vendorId) ?? 0;
      const vendorStateCode = vendorMeta.get(vendorId) ?? settings.sellerStateCode;
      const interState = !!placeOfSupply && placeOfSupply !== vendorStateCode;
      return {
        vendorId,
        vendorStateCode,
        lines: groupLines,
        subtotal: groupSubtotal,
        shipping: groupShipping,
        total: sumCurrency([groupSubtotal, groupShipping]),
        weightGrams: groupLines.reduce((sum, l) => sum + l.weightGrams * l.quantity, 0),
        tax: summariseTax(
          groupLines.map((l) => ({ lineTotal: l.lineTotal, gstRate: l.gstRate })),
          interState,
          groupShipping,
        ),
      };
    });

  // Parent aggregates — with one vendor these are identical to the old
  // single-seller totals.
  const tax = {
    taxableAmount: sumCurrency(groups.map((g) => g.tax.taxableAmount)),
    cgst: sumCurrency(groups.map((g) => g.tax.cgst)),
    sgst: sumCurrency(groups.map((g) => g.tax.sgst)),
    igst: sumCurrency(groups.map((g) => g.tax.igst)),
  };

  const userId = user.id;

  // Idempotency: the checkout form sends a key that is stable for one cart
  // payload. A double click or a network retry replays the original order
  // (minting a fresh single-use payment session) instead of creating —
  // and charging for — a second one.
  const checkoutKey = (() => {
    const raw = str(formData.get("checkoutKey")).trim();
    return /^[A-Za-z0-9_-]{8,64}$/.test(raw) ? raw : null;
  })();
  if (checkoutKey) {
    const existing = await db.order.findFirst({
      where: { userId, checkoutKey },
      select: { id: true },
    });
    if (existing) {
      return replayCheckout(existing.id, userId);
    }
  }

  const createOrder = (orderNumber: string) =>
    db.$transaction(async (tx) => {
      // Deliberately NO stock reservation and NO invoice number here: the
      // order is unpaid until Cashfree confirms the money. Both happen in
      // confirmOrderPayment, after verification.
      const created = await tx.order.create({
        select: { id: true, orderNumber: true },
        data: {
          orderNumber,
          userId,
          checkoutKey,
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
          paymentMethod: "ONLINE",
          paymentStatus: "PENDING",
          cashfreeOrderId: orderNumber,
        },
      });

      // One sub-order per vendor, carrying that vendor's lines, shipping share
      // and GST carve-out. Customer/address snapshots are copied so each
      // vendor can fulfil and invoice their leg independently.
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        const subOrderNumber = generateSubOrderNumber(orderNumber, i);
        await tx.order.create({
          data: {
            orderNumber: subOrderNumber,
            subOrderNumber,
            parentId: created.id,
            vendorId: group.vendorId,
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
            subtotal: group.subtotal,
            shipping: group.shipping,
            total: group.total,
            taxableAmount: group.tax.taxableAmount,
            cgst: group.tax.cgst,
            sgst: group.tax.sgst,
            igst: group.tax.igst,
            placeOfSupply,
            shippingZone: quote.zone?.name ?? null,
            chargeableWeight: group.weightGrams,
            shippingMethod: quote.method,
            items: {
              create: group.lines.map((line) => ({
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
                // stockReserved stays 0 until payment confirms the order.
              })),
            },
          },
        });
      }

      return created;
    });

  // `orderNumber` is @unique with a short random suffix; on the rare
  // collision (P2002) retry with a fresh number instead of surfacing a 500.
  // A P2002 on (userId, checkoutKey) is a concurrent replay of the same
  // checkout — resume that order rather than erroring.
  let order: { id: string; orderNumber: string } | null = null;
  for (let attempt = 0; attempt < 3 && !order; attempt++) {
    try {
      order = await createOrder(generateOrderNumber());
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? (error as { code?: string }).code
          : undefined;
      if (code === "P2002" && checkoutKey) {
        const raced = await db.order.findFirst({
          where: { userId, checkoutKey },
          select: { id: true },
        });
        if (raced) {
          return replayCheckout(raced.id, userId);
        }
      }
      if (code !== "P2002" || attempt === 2) {
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

  // The local order exists (unpaid). Mint the single-use Cashfree session —
  // kept OUTSIDE the transaction because it is a network call. If the
  // gateway is unreachable the order stays PENDING and the customer retries
  // (via the idempotency replay above) without duplicating anything.
  try {
    const session = await createCashfreeOrder({
      orderId: order.orderNumber,
      amount: total,
      customerId: userId,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
    });
    return {
      ok: true,
      message: "Order created — opening secure payment…",
      data: { orderNumber: order.orderNumber, paymentSessionId: session.paymentSessionId, alreadyPaid: false },
    };
  } catch (error) {
    console.error("[placeOrderAction] cashfree session failed", error);
    const reason =
      error instanceof CashfreeError ? error.message : "We couldn't reach the payment gateway.";
    return {
      ok: false,
      message: `${reason} Your order ${order.orderNumber} is saved — please press Pay again.`,
    };
  }
}

/**
 * Resumes an existing checkout (double submit, network retry, gateway down
 * at first attempt): verifies whether the money already arrived and mints a
 * fresh single-use session otherwise. Never creates a second order.
 */
async function replayCheckout(orderId: string, userId: string): Promise<ActionResult<CheckoutSession>> {
  try {
    const session = await createPaymentSessionForOrder(orderId, userId);
    if (session.alreadyPaid) {
      return {
        ok: true,
        message: "Payment already received for this order!",
        data: { orderNumber: session.orderNumber, paymentSessionId: null, alreadyPaid: true },
      };
    }
    return {
      ok: true,
      message: "Order found — opening secure payment…",
      data: {
        orderNumber: session.orderNumber,
        paymentSessionId: session.paymentSessionId,
        alreadyPaid: false,
      },
    };
  } catch (error) {
    console.error("[placeOrderAction] replay failed", error);
    return {
      ok: false,
      message:
        error instanceof CashfreeError || error instanceof Error
          ? error.message
          : "We couldn't resume your checkout. Please try again.",
    };
  }
}
