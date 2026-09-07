"use server";

import { db } from "@/lib/db";
import { limitKey, rateLimit } from "@/lib/rate-limit";
import {
  bulkEnquirySchema,
  contactMessageSchema,
  newsletterSchema,
  type BulkEnquiryInput,
  type ContactMessageInput,
  type NewsletterInput,
} from "@/lib/validations/shop";
import type { ActionResult } from "@/types";
import { str, strOpt } from "@/lib/form";

/**
 * Public lead-capture actions: bulk enquiry, contact message, newsletter.
 */

export async function submitBulkEnquiryAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const allowed = rateLimit(await limitKey("enquiry"), 5, 60_000);
  if (!allowed) {
    return { ok: false, message: "Too many enquiries. Please try again in a minute." };
  }

  const parsed = bulkEnquirySchema.safeParse({
    name: str(formData.get("name")),
    email: str(formData.get("email")),
    phone: str(formData.get("phone")),
    companyName: str(formData.get("companyName")),
    quantity: (() => { const q = strOpt(formData.get("quantity")); return q === undefined ? undefined : Number(q); })(),
    message: str(formData.get("message")),
    productId: strOpt(formData.get("productId")),
    productName: strOpt(formData.get("productName")),
  } satisfies BulkEnquiryInput);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await db.bulkEnquiry.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      companyName: parsed.data.companyName || null,
      quantity: parsed.data.quantity ?? null,
      message: parsed.data.message,
      productId: parsed.data.productId || null,
      productName: parsed.data.productName || null,
    },
  });

  return {
    ok: true,
    message: "Enquiry submitted! Our team will get back to you within 24 hours.",
  };
}

export async function submitContactMessageAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const allowed = rateLimit(await limitKey("contact"), 5, 60_000);
  if (!allowed) {
    return { ok: false, message: "Too many messages. Please try again in a minute." };
  }

  const parsed = contactMessageSchema.safeParse({
    name: str(formData.get("name")),
    email: str(formData.get("email")),
    phone: str(formData.get("phone")),
    subject: str(formData.get("subject")),
    message: str(formData.get("message")),
  } satisfies ContactMessageInput);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await db.contactMessage.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      subject: parsed.data.subject || null,
      message: parsed.data.message,
    },
  });

  return { ok: true, message: "Message sent! We usually reply within one business day." };
}

export async function subscribeNewsletterAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const allowed = rateLimit(await limitKey("newsletter"), 8, 60_000);
  if (!allowed) {
    return { ok: false, message: "Too many attempts. Please try again shortly." };
  }

  const parsed = newsletterSchema.safeParse({
    email: str(formData.get("email")),
  } satisfies NewsletterInput);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please enter a valid email address.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const existing = await db.newsletterSubscriber.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (existing) {
    return { ok: true, message: "You are already subscribed to our newsletter." };
  }

  await db.newsletterSubscriber.create({
    data: { email: parsed.data.email.toLowerCase() },
  });

  return { ok: true, message: "Subscribed! Welcome to the KCS G-Mart newsletter." };
}
