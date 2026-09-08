"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { limitKey, rateLimit } from "@/lib/rate-limit";
import { checkoutSchema } from "@/lib/validations/shop";
import { generateOrderNumber } from "@/lib/utils";
import type { ActionResult } from "@/types";
import { str, strOpt } from "@/lib/form";

/**
 * Order placement. Prices are always recomputed server-side from the
 * ProductPrice tiers — client-supplied amounts are never trusted.
 */

const FREE_SHIPPING_THRESHOLD = 1000;
const SHIPPING_FEE = 100;

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
    return {
      ok: false,
      message: "Too many attempts. Please try again shortly.",
    };
  }

  let items: { productId: string; quantity: number }[];
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]")) as {
      productId: string;
      quantity: number;
    }[];
  } catch {
    return {
      ok: false,
      message: "Your cart could not be read. Please refresh and try again.",
    };
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

  // Merge duplicate product ids (a stale client cart can contain the same
  // product twice) so the availability check below compares like with like.
  const merged = new Map<string, number>();
  for (const item of data.items) {
    merged.set(
      item.productId,
      (merged.get(item.productId) ?? 0) + item.quantity,
    );
  }
  const requested = [...merged.entries()].map(([productId, quantity]) => ({
    productId,
    quantity,
  }));

  // Re-fetch products and compute prices from the lowest applicable tier.
  const products = await db.product.findMany({
    where: { id: { in: requested.map((i) => i.productId) }, isActive: true },
    include: { prices: true },
  });

  if (products.length !== requested.length) {
    return {
      ok: false,
      message: "Some items in your cart are no longer available.",
    };
  }

  const lines: {
    productId: string;
    name: string;
    image: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[] = [];

  for (const item of requested) {
    const product = products.find((p) => p.id === item.productId)!;
    const tiers = [...product.prices].sort(
      (a, b) => b.minQuantity - a.minQuantity,
    );
    const tier =
      tiers.find((t) => item.quantity >= t.minQuantity) ??
      tiers[tiers.length - 1];
    // Products without tiers fall back to the base price; a product with
    // neither cannot be ordered online (avoid creating a ₹0 / NaN order).
    const unitPrice = tier
      ? Number(tier.price)
      : Number(product.basePrice ?? 0);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return {
        ok: false,
        message: `"${product.name}" is available on enquiry only. Please remove it from your cart or contact us for a quote.`,
      };
    }

    // Enforce the product's minimum order quantity (lowest tier) server-side as well.
    const minQty =
      tiers.length > 0 ? Math.max(1, tiers[tiers.length - 1].minQuantity) : 1;
    if (item.quantity < minQty) {
      return {
        ok: false,
        message: `"${product.name}" has a minimum order quantity of ${minQty} pcs.`,
      };
    }

    lines.push({
      productId: product.id,
      name: product.name,
      image: product.image,
      unitPrice,
      quantity: item.quantity,
      lineTotal: unitPrice * item.quantity,
    });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;

  const userId = user.id;
  const createOrder = (orderNumber: string) =>
    db.order.create({
      select: { orderNumber: true },
      data: {
        orderNumber,
        userId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        companyName: data.companyName || null,
        gstNo: data.gstNo || null,
        billingAddress: data.billingAddress,
        billingCity: data.billingCity,
        billingState: data.billingState,
        billingPincode: data.billingPincode,
        shippingAddress: data.sameAsBilling
          ? data.billingAddress
          : data.shippingAddress || data.billingAddress,
        shippingCity: data.sameAsBilling
          ? data.billingCity
          : data.shippingCity || data.billingCity,
        shippingState: data.sameAsBilling
          ? data.billingState
          : data.shippingState || data.billingState,
        shippingPincode: data.sameAsBilling
          ? data.billingPincode
          : data.shippingPincode || data.billingPincode,
        subtotal,
        shipping,
        total,
        notes: data.notes || null,
        items: {
          create: lines.map((line) => ({
            productId: line.productId,
            name: line.name,
            image: line.image,
            unitPrice: line.unitPrice,
            quantity: line.quantity,
            lineTotal: line.lineTotal,
          })),
        },
      },
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
          message:
            "We couldn't place your order right now. Please try again in a moment.",
        };
      }
    }
  }
  if (!order) {
    return {
      ok: false,
      message:
        "We couldn't place your order right now. Please try again in a moment.",
    };
  }

  return {
    ok: true,
    message: "Order placed successfully!",
    data: { orderNumber: order.orderNumber },
  };
}
