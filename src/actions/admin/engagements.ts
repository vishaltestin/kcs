"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { isRecordNotFound } from "@/lib/prisma-errors";
import { assertAdmin, assertAdminOrVendor } from "@/lib/auth/guards";
import {
  bookingStatusSchema,
  enquiryStatusSchema,
  orderStatusSchema,
  roleSchema,
  shipmentSchema,
} from "@/lib/validations/admin";
import { buildTrackingUrl } from "@/lib/couriers";
import { istDateKey } from "@/lib/dates";
import { orderMutationMessage, transitionOrderStatus } from "@/lib/order-mutations";
import type { ActionResult } from "@/types";

/**
 * Admin — orders, enquiries, meetings, messages, users, reviews.
 */

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

/**
 * Revalidate every surface that shows an order (or a sub-order's parent).
 * `orderNumber` is the customer-facing number: for sub-orders we resolve the
 * parent so the customer's order page refreshes too.
 */
async function revalidateOrderSurfaces(order: {
  id: string;
  orderNumber: string;
  parentId: string | null;
}): Promise<void> {
  let customerNumber = order.orderNumber;
  if (order.parentId) {
    const parent = await db.order.findUnique({
      where: { id: order.parentId },
      select: { orderNumber: true },
    });
    if (parent) customerNumber = parent.orderNumber;
  }
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.parentId ?? order.id}`);
  revalidatePath("/vendor/orders");
  revalidatePath(`/order-success/${customerNumber}`);
  revalidatePath("/profile");
}

export async function updateOrderStatusAction(
  orderId: string,
  status: string,
): Promise<ActionResult> {
  await assertAdmin();

  const parsed = orderStatusSchema.safeParse(status);
  if (!parsed.success) return { ok: false, message: "Invalid status." };

  const existing = await db.order.findUnique({ where: { id: orderId } });
  if (!existing) return { ok: false, message: "Order not found." };

  let restored = 0;
  try {
    const result = await db.$transaction((tx) =>
      // Single shared path: validates the transition, refuses changes to a
      // derived parent, restores reserved stock on cancellation, and rolls
      // the sub-order status up to the parent.
      transitionOrderStatus(tx, orderId, parsed.data),
    );
    restored = result.restored;
  } catch (error) {
    const message = orderMutationMessage(error);
    if (message) return { ok: false, message };
    if (isRecordNotFound(error))
      return { ok: false, message: "Order not found — it may have been removed." };
    throw error;
  }
  await revalidateOrderSurfaces(existing);

  const suffix =
    parsed.data === "CANCELLED" && restored > 0
      ? ` ${restored} unit${restored === 1 ? "" : "s"} returned to stock.`
      : "";
  return { ok: true, message: `Order marked ${parsed.data.toLowerCase()}.${suffix}` };
}

/**
 * Record courier / tracking details for an order. Marks the order SHIPPED
 * (unless it is already delivered) and stamps `shippedAt`.
 */
export async function updateShipmentAction(
  orderId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await assertAdmin();

  const parsed = shipmentSchema.safeParse({
    courierName: String(formData.get("courierName") ?? "").trim(),
    trackingNumber: String(formData.get("trackingNumber") ?? "").trim(),
    trackingUrl: String(formData.get("trackingUrl") ?? "").trim(),
    expectedAt: String(formData.get("expectedAt") ?? "").trim(),
    shipmentNote: String(formData.get("shipmentNote") ?? "").trim(),
    markShipped: formData.get("markShipped") === "true",
  });
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, orderNumber: true, shippedAt: true, parentId: true },
  });
  if (!existing) return { ok: false, message: "Order not found." };
  if (existing.status === "CANCELLED") return { ok: false, message: "Cancelled orders can't be shipped." };

  const d = parsed.data;
  const trackingUrl = buildTrackingUrl(d.courierName, d.trackingNumber, d.trackingUrl);
  // Only an undispatched order can *become* shipped; for one already shipped
  // this is just a details edit (status stays put).
  const becomesShipped =
    d.markShipped && (existing.status === "PENDING" || existing.status === "CONFIRMED");

  try {
    await db.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          courierName: d.courierName || null,
          trackingNumber: d.trackingNumber || null,
          trackingUrl,
          expectedAt: d.expectedAt ? new Date(d.expectedAt) : null,
          shipmentNote: d.shipmentNote || null,
        },
      });
      // Status changes go through the shared transition path (parent roll-up
      // included) rather than being written directly.
      if (becomesShipped) await transitionOrderStatus(tx, orderId, "SHIPPED");
    });
  } catch (error) {
    const message = orderMutationMessage(error);
    if (message) return { ok: false, message };
    throw error;
  }

  await revalidateOrderSurfaces(existing);
  return { ok: true, message: becomesShipped ? "Shipment saved — order marked shipped." : "Shipment details saved." };
}

// ---------------------------------------------------------------------------
// Bulk enquiries
// ---------------------------------------------------------------------------

export async function updateEnquiryStatusAction(
  id: number,
  status: string,
): Promise<ActionResult> {
  await assertAdmin();

  const parsed = enquiryStatusSchema.safeParse(status);
  if (!parsed.success) return { ok: false, message: "Invalid status." };

  try {
    await db.bulkEnquiry.update({
      where: { id },
      data: { status: parsed.data },
    });
  } catch (error) {
    if (isRecordNotFound(error))
      return {
        ok: false,
        message: "Enquiry not found — it may have been removed.",
      };
    throw error;
  }
  revalidatePath("/admin/enquiries");
  return { ok: true, message: "Enquiry updated." };
}

export async function deleteEnquiryAction(id: number): Promise<ActionResult> {
  await assertAdmin();
  try {
    await db.bulkEnquiry.delete({ where: { id } });
  } catch (error) {
    if (isRecordNotFound(error))
      return {
        ok: false,
        message: "Enquiry not found — it may have been removed.",
      };
    throw error;
  }
  revalidatePath("/admin/enquiries");
  return { ok: true, message: "Enquiry deleted." };
}

// ---------------------------------------------------------------------------
// Meeting bookings
// ---------------------------------------------------------------------------

export async function updateBookingStatusAction(
  id: number,
  status: string,
): Promise<ActionResult> {
  await assertAdmin();

  const parsed = bookingStatusSchema.safeParse(status);
  if (!parsed.success) return { ok: false, message: "Invalid status." };

  try {
    const booking = await db.meetingBooking.findUnique({
      where: { id },
      select: { id: true, date: true, timeSlot: true },
    });
    if (!booking) return { ok: false, message: "Booking not found — it may have been removed." };

    await db.meetingBooking.update({
      where: { id },
      data: {
        status: parsed.data,
        // The unique slot key is held only while the booking is live —
        // cancelling frees the slot for someone else to book.
        activeSlot:
          parsed.data === "CANCELLED"
            ? null
            : `${istDateKey(booking.date)}_${booking.timeSlot}`,
      },
    });
  } catch (error) {
    // Re-activating a booking whose slot was taken in the meantime.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return { ok: false, message: "That slot is already taken by another booking." };
    }
    if (isRecordNotFound(error))
      return {
        ok: false,
        message: "Booking not found — it may have been removed.",
      };
    throw error;
  }
  revalidatePath("/admin/meetings");
  return { ok: true, message: "Booking updated." };
}

export async function deleteBookingAction(id: number): Promise<ActionResult> {
  await assertAdmin();
  try {
    await db.meetingBooking.delete({ where: { id } });
  } catch (error) {
    if (isRecordNotFound(error))
      return {
        ok: false,
        message: "Booking not found — it may have been removed.",
      };
    throw error;
  }
  revalidatePath("/admin/meetings");
  return { ok: true, message: "Booking deleted." };
}

// ---------------------------------------------------------------------------
// Contact messages
// ---------------------------------------------------------------------------

export async function markMessageReadAction(
  id: number,
  isRead: boolean,
): Promise<ActionResult> {
  await assertAdmin();
  try {
    await db.contactMessage.update({ where: { id }, data: { isRead } });
  } catch (error) {
    if (isRecordNotFound(error))
      return {
        ok: false,
        message: "Message not found — it may have been removed.",
      };
    throw error;
  }
  revalidatePath("/admin/messages");
  return {
    ok: true,
    message: isRead ? "Marked as read." : "Marked as unread.",
  };
}

export async function deleteMessageAction(id: number): Promise<ActionResult> {
  await assertAdmin();
  try {
    await db.contactMessage.delete({ where: { id } });
  } catch (error) {
    if (isRecordNotFound(error))
      return {
        ok: false,
        message: "Message not found — it may have been removed.",
      };
    throw error;
  }
  revalidatePath("/admin/messages");
  return { ok: true, message: "Message deleted." };
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function updateUserRoleAction(
  userId: string,
  role: string,
): Promise<ActionResult> {
  const admin = await assertAdmin();
  const parsed = roleSchema.safeParse(role);
  if (!parsed.success) return { ok: false, message: "Invalid role." };

  if (admin.id === userId && parsed.data !== "ADMIN") {
    return { ok: false, message: "You cannot demote your own account." };
  }

  try {
    await db.user.update({
      where: { id: userId },
      data: {
        role: parsed.data,
        // A role change must not leave stale powers in an old session.
        sessionVersion: { increment: 1 },
      },
    });
  } catch (error) {
    if (isRecordNotFound(error))
      return {
        ok: false,
        message: "User not found — they may have been removed.",
      };
    throw error;
  }
  revalidatePath("/admin/users");
  return { ok: true, message: `Role updated to ${parsed.data}. Their sessions were signed out.` };
}

export async function toggleUserVerifiedAction(
  userId: string,
  verified: boolean,
): Promise<ActionResult> {
  await assertAdmin();

  try {
    await db.user.update({
      where: { id: userId },
      data: {
        emailVerifiedAt: verified ? new Date() : null,
        verificationToken: null,
        // Un-verifying (or re-verifying) an account invalidates its sessions.
        sessionVersion: { increment: 1 },
      },
    });
  } catch (error) {
    if (isRecordNotFound(error))
      return {
        ok: false,
        message: "User not found — they may have been removed.",
      };
    throw error;
  }
  revalidatePath("/admin/users");
  return {
    ok: true,
    message: verified ? "User verified." : "User unverified.",
  };
}

export async function deleteUserAction(userId: string): Promise<ActionResult> {
  const admin = await assertAdmin();

  if (admin.id === userId) {
    return { ok: false, message: "You cannot delete your own account." };
  }

  const existing = await db.user.findUnique({ where: { id: userId } });
  if (!existing) return { ok: false, message: "User not found." };

  try {
    await db.user.delete({ where: { id: userId } });
  } catch (error) {
    if (isRecordNotFound(error))
      return {
        ok: false,
        message: "User not found — they may have been removed.",
      };
    throw error;
  }
  revalidatePath("/admin/users");
  return { ok: true, message: "User deleted." };
}

// ---------------------------------------------------------------------------
// Reviews moderation
// ---------------------------------------------------------------------------

export async function approveReviewAction(
  id: number,
  approve: boolean,
): Promise<ActionResult> {
  await assertAdmin();
  try {
    await db.review.update({ where: { id }, data: { isApproved: approve } });
  } catch (error) {
    if (isRecordNotFound(error))
      return {
        ok: false,
        message: "Review not found — it may have been removed.",
      };
    throw error;
  }
  revalidatePath("/admin/reviews");
  revalidatePath("/product");
  return { ok: true, message: approve ? "Review approved." : "Review hidden." };
}

export async function deleteReviewAction(id: number): Promise<ActionResult> {
  await assertAdmin();
  try {
    await db.review.delete({ where: { id } });
  } catch (error) {
    if (isRecordNotFound(error))
      return {
        ok: false,
        message: "Review not found — it may have been removed.",
      };
    throw error;
  }
  revalidatePath("/admin/reviews");
  revalidatePath("/product");
  return { ok: true, message: "Review deleted." };
}

// ---------------------------------------------------------------------------
// Newsletter
// ---------------------------------------------------------------------------

export async function deleteSubscriberAction(
  id: number,
): Promise<ActionResult> {
  await assertAdmin();
  try {
    await db.newsletterSubscriber.delete({ where: { id } });
  } catch (error) {
    if (isRecordNotFound(error))
      return {
        ok: false,
        message: "Subscriber not found — they may have been removed.",
      };
    throw error;
  }
  revalidatePath("/admin/subscribers");
  return { ok: true, message: "Subscriber removed." };
}

// ---------------------------------------------------------------------------
// Media — list images shipped in /public/images (picker for admin forms)
// ---------------------------------------------------------------------------

export async function listPublicImagesAction(prefix = ""): Promise<string[]> {
  // Vendors use the same image picker for their product galleries.
  await assertAdminOrVendor();

  const { readdir } = await import("node:fs/promises");
  const path = await import("node:path");

  const root = path.join(process.cwd(), "public", "images");
  const uploadsRoot = path.join(process.cwd(), "public", "uploads");
  const results: string[] = [];

  async function walk(dir: string) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (/\.(jpg|jpeg|png|webp|avif|gif|svg)$/i.test(entry.name)) {
        const rel = path
          .relative(path.join(process.cwd(), "public"), full)
          .split(path.sep)
          .join("/");
        if (prefix && !rel.toLowerCase().includes(prefix.toLowerCase()))
          continue;
        results.push(`/${rel}`);
      }
    }
  }

  await walk(root);

  // Previously uploaded files (served through /api/uploads/…), newest first.
  const uploaded: string[] = [];
  try {
    const entries = await readdir(uploadsRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !/\.(jpg|jpeg|png|webp|avif|gif)$/i.test(entry.name)) continue;
      if (prefix && !entry.name.toLowerCase().includes(prefix.toLowerCase())) continue;
      uploaded.push(`/api/uploads/${entry.name}`);
    }
  } catch {
    // no uploads yet
  }
  uploaded.sort().reverse();

  return [...uploaded, ...results.sort()];
}
