import { z } from "zod";

import { MEETING_TIME_SLOTS } from "@/lib/constants";
import { GSTIN_REGEX } from "@/lib/tax";

// ---------------------------------------------------------------------------
// Orders / checkout
// ---------------------------------------------------------------------------

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(3, "Full name is required."),
  customerEmail: z.string().trim().email("Please enter a valid email address."),
  customerPhone: z
    .string()
    .trim()
    .regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number."),
  companyName: z.string().trim().max(160).optional().or(z.literal("")),
  gstNo: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => v === "" || GSTIN_REGEX.test(v), "Enter a valid 15-character GSTIN (e.g. 07ABCDE1234F1Z5).")
    .optional()
    .or(z.literal("")),

  billingAddress: z.string().trim().min(5, "Billing address is required."),
  billingCity: z.string().trim().min(2, "City is required."),
  billingState: z.string().trim().min(2, "State is required."),
  billingPincode: z.string().trim().regex(/^\d{6}$/, "PIN code must be 6 digits."),

  sameAsBilling: z.boolean(),

  shippingAddress: z.string().trim().optional().or(z.literal("")),
  shippingCity: z.string().trim().optional().or(z.literal("")),
  shippingState: z.string().trim().optional().or(z.literal("")),
  shippingPincode: z.string().trim().optional().or(z.literal("")),

  notes: z.string().trim().max(1000, "Notes can be at most 1000 characters.").optional().or(z.literal("")),

  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().min(1).nullable().optional(),
        quantity: z.number().int().min(1).max(10000),
      })
    )
    .min(1, "Your cart is empty."),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/**
 * Client-side checkout form schema — the RHF resolver validates only the
 * fields the form actually registers. `items` comes from the cart store (set
 * on submit), so validating it client-side would always fail and silently
 * block the Place Order button. The server re-validates the full payload.
 */
export const checkoutFormSchema = checkoutSchema.omit({ items: true });
export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

// ---------------------------------------------------------------------------
// Enquiries / contact / newsletter
// ---------------------------------------------------------------------------

export const bulkEnquirySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("Please enter a valid email address."),
  phone: z
    .string()
    .trim()
    .regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number."),
  companyName: z.string().trim().max(160).optional().or(z.literal("")),
  quantity: z.number().int().min(1, "Quantity must be at least 1.").max(100000).optional(),
  message: z.string().trim().min(10, "Please tell us a bit more (min 10 characters).").max(2000),
  productId: z.string().optional(),
  productName: z.string().optional(),
});

export type BulkEnquiryInput = z.infer<typeof bulkEnquirySchema>;

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("Please enter a valid email address."),
  phone: z
    .string()
    .trim()
    .regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number.")
    .optional()
    .or(z.literal("")),
  subject: z.string().trim().max(160).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Message must be at least 10 characters.").max(2000),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;

export const newsletterSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1, "Please select a rating.").max(5),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  comment: z.string().trim().min(10, "Review must be at least 10 characters.").max(2000),
  authorName: z.string().trim().min(2, "Please provide your name.").max(80),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

// ---------------------------------------------------------------------------
// Book a meeting
// ---------------------------------------------------------------------------

export const meetingBookingSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("Please enter a valid email address."),
  phone: z
    .string()
    .trim()
    .regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number.")
    .optional()
    .or(z.literal("")),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  date: z.string().min(1, "Please pick a date."), // yyyy-mm-dd
  timeSlot: z.enum(MEETING_TIME_SLOTS),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type MeetingBookingInput = z.infer<typeof meetingBookingSchema>;
