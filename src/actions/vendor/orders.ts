"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { assertVendor } from "@/lib/auth/guards";
import { shipmentSchema } from "@/lib/validations/admin";
import { buildTrackingUrl } from "@/lib/couriers";
import { orderMutationMessage, transitionOrderStatus } from "@/lib/order-mutations";
import type { ActionResult } from "@/types";

/**
 * Vendor portal — sub-order fulfilment. A vendor only ever touches sub-orders
 * assigned to their vendorId, and every mutation rolls the parent order's
 * derived status forward.
 */

async function ownSubOrder(vendorId: string, orderId: string) {
  return db.order.findFirst({
    where: { id: orderId, vendorId, parentId: { not: null } },
    select: {
      id: true,
      status: true,
      subOrderNumber: true,
      parentId: true,
      shippedAt: true,
      orderNumber: true,
    },
  });
}

async function revalidateSurfaces(subOrder: {
  id: string;
  parentId: string | null;
}): Promise<void> {
  let customerNumber: string | null = null;
  if (subOrder.parentId) {
    const parent = await db.order.findUnique({
      where: { id: subOrder.parentId },
      select: { orderNumber: true },
    });
    customerNumber = parent?.orderNumber ?? null;
  }
  revalidatePath("/vendor/orders");
  revalidatePath(`/vendor/orders/${subOrder.id}`);
  revalidatePath("/vendor");
  revalidatePath("/admin/orders");
  if (customerNumber) revalidatePath(`/order-success/${customerNumber}`);
  revalidatePath("/profile");
}

/** Confirm a pending sub-order so the customer sees it being prepared. */
export async function vendorConfirmSubOrderAction(orderId: string): Promise<ActionResult> {
  const { vendor } = await assertVendor();

  const sub = await ownSubOrder(vendor.id, orderId);
  if (!sub) return { ok: false, message: "Order not found — it may belong to another seller." };

  try {
    await db.$transaction((tx) => transitionOrderStatus(tx, sub.id, "CONFIRMED"));
  } catch (error) {
    const message = orderMutationMessage(error);
    if (message) return { ok: false, message };
    throw error;
  }

  await revalidateSurfaces(sub);
  return { ok: true, message: "Order confirmed." };
}

/**
 * Mark a sub-order delivered. Delivery is only allowed from SHIPPED — a
 * vendor cannot skip dispatch (the shared transition path enforces it).
 */
export async function vendorDeliverSubOrderAction(orderId: string): Promise<ActionResult> {
  const { vendor } = await assertVendor();

  const sub = await ownSubOrder(vendor.id, orderId);
  if (!sub) return { ok: false, message: "Order not found — it may belong to another seller." };

  try {
    await db.$transaction((tx) => transitionOrderStatus(tx, sub.id, "DELIVERED"));
  } catch (error) {
    const message = orderMutationMessage(error);
    if (message) return { ok: false, message };
    throw error;
  }

  await revalidateSurfaces(sub);
  return { ok: true, message: "Order marked delivered." };
}

/**
 * Save courier / tracking details for a sub-order. "Save & mark shipped"
 * additionally moves the sub-order to SHIPPED.
 */
export async function vendorUpdateShipmentAction(
  orderId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { vendor } = await assertVendor();

  const sub = await ownSubOrder(vendor.id, orderId);
  if (!sub) return { ok: false, message: "Order not found — it may belong to another seller." };
  if (sub.status === "CANCELLED") return { ok: false, message: "Cancelled orders can't be shipped." };

  const parsed = shipmentSchema.safeParse({
    courierName: String(formData.get("courierName") ?? "").trim(),
    trackingNumber: String(formData.get("trackingNumber") ?? "").trim(),
    trackingUrl: String(formData.get("trackingUrl") ?? "").trim(),
    expectedAt: String(formData.get("expectedAt") ?? "").trim(),
    shipmentNote: String(formData.get("shipmentNote") ?? "").trim(),
    markShipped: formData.get("markShipped") === "true",
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const d = parsed.data;
  const trackingUrl = buildTrackingUrl(d.courierName, d.trackingNumber, d.trackingUrl);
  const becomesShipped =
    d.markShipped && (sub.status === "PENDING" || sub.status === "CONFIRMED");

  try {
    await db.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: sub.id },
        data: {
          courierName: d.courierName || null,
          trackingNumber: d.trackingNumber || null,
          trackingUrl,
          expectedAt: d.expectedAt ? new Date(d.expectedAt) : null,
          shipmentNote: d.shipmentNote || null,
        },
      });
      // Shared transition path — enforces PENDING/CONFIRMED → SHIPPED and
      // rolls the parent order up inside the same transaction.
      if (becomesShipped) await transitionOrderStatus(tx, sub.id, "SHIPPED");
    });
  } catch (error) {
    const message = orderMutationMessage(error);
    if (message) return { ok: false, message };
    throw error;
  }

  await revalidateSurfaces(sub);
  return { ok: true, message: becomesShipped ? "Shipment saved — order marked shipped." : "Shipment details saved." };
}
