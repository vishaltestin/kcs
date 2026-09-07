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
  formData: FormData
): Promise<ActionResult<{ orderNumber: string }>> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, message: "Please sign in to place an order." };
  }

  const allowed = rateLimit(await limitKey("checkout"), 5, 60_000);
  if (!allowed) {
    return { ok: false, message: "Too many attempts. Please try again shortly." };
  }

  let items: { productId: string; quantity: number }[];
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]")) as { productId: string; quantity: number }[];
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

  // Re-fetch products and compute prices from the lowest applicable tier.
  const products = await db.product.findMany({
    where: { id: { in: data.items.map((i) => i.productId) }, isActive: true },
    include: { prices: true },
  });

  if (products.length !== data.items.length) {
    return { ok: false, message: "Some items in your cart are no longer available." };
  }

  const lines = data.items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;
    const tiers = [...product.prices].sort((a, b) => b.minQuantity - a.minQuantity);
    const tier = tiers.find((t) => item.quantity >= t.minQuantity) ?? tiers[tiers.length - 1];
    const unitPrice = Number(tier.price);
    const quantity = item.quantity;

    return {
      productId: product.id,
      name: product.name,
      image: product.image,
      unitPrice,
      quantity,
      lineTotal: unitPrice * quantity,
    };
  });

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;

  const order = await db.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId: user.id,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      companyName: data.companyName || null,
      gstNo: data.gstNo || null,
      billingAddress: data.billingAddress,
      billingCity: data.billingCity,
      billingState: data.billingState,
      billingPincode: data.billingPincode,
      shippingAddress: data.sameAsBilling ? data.billingAddress : data.shippingAddress || data.billingAddress,
      shippingCity: data.sameAsBilling ? data.billingCity : data.shippingCity || data.billingCity,
      shippingState: data.sameAsBilling ? data.billingState : data.shippingState || data.billingState,
      shippingPincode: data.sameAsBilling ? data.billingPincode : data.shippingPincode || data.billingPincode,
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

  return {
    ok: true,
    message: "Order placed successfully!",
    data: { orderNumber: order.orderNumber },
  };
}
