"use server";

import { db } from "@/lib/db";
import { limitKey, rateLimit } from "@/lib/rate-limit";
import { meetingBookingSchema } from "@/lib/validations/shop";
import type { ActionResult } from "@/types";
import { str, strOpt } from "@/lib/form";

/**
 * "Book a Meeting" flow (navbar CTA).
 */
export async function bookMeetingAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const allowed = rateLimit(await limitKey("meeting"), 5, 60_000);
  if (!allowed) {
    return { ok: false, message: "Too many bookings. Please try again in a minute." };
  }

  const parsed = meetingBookingSchema.safeParse({
    name: str(formData.get("name")),
    email: str(formData.get("email")),
    phone: str(formData.get("phone")),
    company: str(formData.get("company")),
    date: str(formData.get("date")),
    timeSlot: str(formData.get("timeSlot")),
    notes: str(formData.get("notes")),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const date = new Date(`${parsed.data.date}T00:00:00`);
  if (Number.isNaN(date.getTime()) || date < new Date(new Date().toDateString())) {
    return {
      ok: false,
      message: "Please choose today or a future date.",
      fieldErrors: { date: ["Choose a valid upcoming date."] },
    };
  }

  // Prevent double-booking the same slot.
  const clash = await db.meetingBooking.findFirst({
    where: { date, timeSlot: parsed.data.timeSlot, status: { not: "CANCELLED" } },
  });
  if (clash) {
    return {
      ok: false,
      message: "That slot has just been taken. Please pick another time.",
      fieldErrors: { timeSlot: ["Slot unavailable."] },
    };
  }

  await db.meetingBooking.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      company: parsed.data.company || null,
      date,
      timeSlot: parsed.data.timeSlot,
      notes: parsed.data.notes || null,
    },
  });

  return {
    ok: true,
    message: "Meeting booked! Our team will confirm the details by email.",
  };
}
