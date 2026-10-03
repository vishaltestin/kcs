"use server";

import { db } from "@/lib/db";
import { limitKey, rateLimit } from "@/lib/rate-limit";
import { meetingBookingSchema } from "@/lib/validations/shop";
import { istDateKey, isValidIstDay, isTodayOrFutureIst, parseIstDay } from "@/lib/dates";
import type { ActionResult } from "@/types";
import { str, strOpt } from "@/lib/form";

/**
 * "Book a Meeting" flow (navbar CTA).
 *
 * Days are IST calendar days stored as UTC midnight (see lib/dates), and a
 * unique `activeSlot` key makes concurrent bookings of the same slot
 * impossible — the pre-check remains only to give a friendlier message when
 * the slot is already taken, the constraint is what actually guarantees it.
 */

function slotKey(day: Date, timeSlot: string): string {
  return `${istDateKey(day)}_${timeSlot}`;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

const SLOT_TAKEN = "That slot has just been taken. Please pick another time.";

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
    company: strOpt(formData.get("company")),
    date: str(formData.get("date")),
    timeSlot: str(formData.get("timeSlot")),
    notes: strOpt(formData.get("notes")),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // IST calendar day, stored as UTC midnight; "today" is IST today.
  if (!isValidIstDay(parsed.data.date)) {
    return {
      ok: false,
      message: "Please choose a valid date.",
      fieldErrors: { date: ["Choose a valid date."] },
    };
  }
  if (!isTodayOrFutureIst(parsed.data.date)) {
    return {
      ok: false,
      message: "Please choose today or a future date.",
      fieldErrors: { date: ["Choose a valid upcoming date."] },
    };
  }
  const date = parseIstDay(parsed.data.date);

  // Friendly pre-check (the unique index below is the real guarantee).
  const clash = await db.meetingBooking.findFirst({
    where: { date, timeSlot: parsed.data.timeSlot, status: { not: "CANCELLED" } },
    select: { id: true },
  });
  if (clash) {
    return { ok: false, message: SLOT_TAKEN, fieldErrors: { timeSlot: ["Slot unavailable."] } };
  }

  try {
    await db.meetingBooking.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        company: parsed.data.company || null,
        date,
        timeSlot: parsed.data.timeSlot,
        notes: parsed.data.notes || null,
        activeSlot: slotKey(date, parsed.data.timeSlot),
      },
    });
  } catch (error) {
    // Two bookings raced for the same slot — the loser gets the friendly
    // message instead of a 500. The unique key is cleared on cancellation,
    // so cancelled slots become bookable again.
    if (isUniqueViolation(error)) {
      return { ok: false, message: SLOT_TAKEN, fieldErrors: { timeSlot: ["Slot unavailable."] } };
    }
    throw error;
  }

  return {
    ok: true,
    message: "Meeting booked! Our team will confirm the details by email.",
  };
}
