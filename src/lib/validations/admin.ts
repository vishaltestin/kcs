import { z } from "zod";

import { HOME_BAND_LIMITS, HOME_BANNER_SLOTS } from "@/lib/home-bands";
import { parseVideoSource } from "@/lib/video";

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

const priceTierSchema = z.object({
  minQuantity: z.number({ message: "Minimum quantity is required." }).int().min(1, "Minimum quantity must be at least 1."),
  price: z.number({ message: "Price is required." }).min(0.01, "Price must be greater than 0."),
  mrp: z.number({ message: "MRP is required." }).min(0.01, "MRP must be greater than 0."),
});

const specSchema = z.object({
  label: z.string().trim().min(1, "Label is required.").max(80),
  value: z.string().trim().min(1, "Value is required.").max(500),
});

export const PRICING_MODES = ["SINGLE", "BULK", "ENQUIRY"] as const;
export type PricingModeValue = (typeof PRICING_MODES)[number];

export const VARIANT_PRICING = ["SHARED", "CUSTOM"] as const;
export type VariantPricingValue = (typeof VARIANT_PRICING)[number];

/** Variants price from the product's own tier table unless they have custom tiers. */
export const usesSharedVariantPricing = (data: { hasVariants: boolean; variantPricing: VariantPricingValue }) =>
  data.hasVariants && data.variantPricing === "SHARED";

const HSN_REGEX = /^\d{4}(\d{2})?(\d{2})?$/;

/**
 * A video for a product or a home band: a YouTube/Vimeo link, or a path/URL to
 * a file. Deliberately permissive about *files* (an extensionless CDN link is
 * still a video) because `src/lib/video.ts` renders anything it is given; what
 * gets rejected is a value that is neither, which would render a dead player.
 */
const videoSource = (label: string) =>
  z
    .string()
    .trim()
    .max(300, `The ${label.toLowerCase()} is too long.`)
    .refine((value) => value === "" || parseVideoSource(value) !== null || /^https?:\/\//i.test(value), {
      message: `Paste a YouTube or Vimeo link, or the path to a video file (/video/…), for the ${label.toLowerCase()}.`,
    });

const optionAxisSchema = z.object({
  name: z.string().trim().min(1, "Option name is required.").max(40),
  values: z.array(z.string().trim().min(1).max(60)).min(1, "Add at least one value."),
});

const variantSchema = z.object({
  id: z.string().optional(),
  attributes: z.record(z.string(), z.string()),
  label: z.string().trim().min(1).max(160),
  sku: z.string().trim().max(60),
  image: z.string().trim(),
  stock: z.number({ message: "Stock is required." }).int().min(0),
  isActive: z.boolean(),
  /** Shared pricing: ₹ added to (or subtracted from) every product tier for this variant. */
  priceDelta: z.number({ message: "Enter a number." }),
  /** Custom pricing: this variant's own tier table (ignored under shared pricing). */
  prices: z.array(priceTierSchema),
  weightGrams: z.number().int().min(0).nullable(),
  lengthCm: z.number().min(0).nullable(),
  widthCm: z.number().min(0).nullable(),
  heightCm: z.number().min(0).nullable(),
});

export type VariantFormInput = z.infer<typeof variantSchema>;

export const productSchema = z
  .object({
    pricingMode: z.enum(PRICING_MODES),
    name: z.string().trim().min(3, "Product name must be at least 3 characters."),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers and dashes.")
      .min(3)
      .max(160),
    sku: z.string().trim().max(40),
    brandId: z.number().int().positive().nullable(),
    categoryIds: z.array(z.number().int().positive()),
    introtext: z.string().trim().max(500),
    description: z.string().trim().max(10000),
    image: z.string().trim().min(1, "Main image is required."),
    images: z.array(z.string().trim().min(1)),
    video: videoSource("product video"),
    delivery: z.string().trim().max(500),
    stock: z.number({ message: "Stock is required." }).int().min(0),
    isActive: z.boolean(),
    isNew: z.boolean(),
    isFeatured: z.boolean(),
    isBestSeller: z.boolean(),
    prices: z.array(priceTierSchema),
    specs: z.array(specSchema),
    // Tax & logistics
    hsnCode: z.string().trim().regex(HSN_REGEX, "HSN must be 4, 6 or 8 digits.").or(z.literal("")),
    gstRate: z.number({ message: "GST rate is required." }).min(0).max(28),
    weightGrams: z.number().int().min(0),
    lengthCm: z.number().min(0).nullable(),
    widthCm: z.number().min(0).nullable(),
    heightCm: z.number().min(0).nullable(),
    // Variants
    hasVariants: z.boolean(),
    /** SHARED: product tiers + per-variant ₹ adjustment. CUSTOM: each variant has its own tier table. */
    variantPricing: z.enum(VARIANT_PRICING),
    options: z.array(optionAxisSchema),
    variants: z.array(variantSchema),
  // SEO overrides (optional — empty strings fall back to derived values)
  metaTitle: z.string().trim().max(70, "Meta title must be at most 70 characters."),
  metaDescription: z
    .string()
    .trim()
    .max(165, "Meta description must be at most 165 characters."),
  metaKeywords: z.string().trim().max(255, "Meta keywords must be at most 255 characters."),
  ogImage: z.string().trim(),
  })
  .refine(
    (data) => data.prices.every((tier) => tier.mrp >= tier.price),
    { message: "MRP must be greater than or equal to the selling price.", path: ["prices"] }
  )
  // Product-level tiers are the source of truth unless every variant prices itself.
  .refine(
    (data) =>
      (data.hasVariants && data.variantPricing === "CUSTOM") || data.pricingMode === "ENQUIRY" || data.prices.length >= 1,
    { message: "Add at least one price.", path: ["prices"] }
  )
  .refine(
    (data) =>
      (data.hasVariants && data.variantPricing === "CUSTOM") ||
      data.pricingMode !== "SINGLE" ||
      (data.prices.length === 1 && data.prices[0].minQuantity === 1),
    { message: "Single-unit products have exactly one price with a minimum quantity of 1.", path: ["prices"] }
  )
  .refine(
    (data) => {
      const qtys = data.prices.map((t) => t.minQuantity);
      return new Set(qtys).size === qtys.length;
    },
    { message: "Each tier needs a different minimum quantity.", path: ["prices"] }
  )
  // Variant rules
  .refine((data) => !data.hasVariants || data.options.length >= 1, {
    message: "Add at least one option (e.g. Colour or Size) to use variants.",
    path: ["options"],
  })
  .refine((data) => !data.hasVariants || data.variants.some((v) => v.isActive), {
    message: "Generate the variants and keep at least one active.",
    path: ["variants"],
  })
  .refine(
    (data) => {
      const skus = data.variants.map((v) => v.sku).filter(Boolean);
      return new Set(skus).size === skus.length;
    },
    { message: "Variant SKUs must be unique.", path: ["variants"] }
  )
  .refine(
    (data) =>
      !data.hasVariants ||
      data.variantPricing !== "CUSTOM" ||
      data.pricingMode === "ENQUIRY" ||
      data.variants.every((v) => !v.isActive || v.prices.length >= 1),
    { message: "Every active variant needs at least one price — or switch to shared pricing.", path: ["variants"] }
  )
  .refine(
    (data) =>
      !data.hasVariants ||
      data.variantPricing !== "CUSTOM" ||
      data.variants.every((v) => {
        const qtys = v.prices.map((t) => t.minQuantity);
        return new Set(qtys).size === qtys.length && v.prices.every((t) => t.mrp >= t.price);
      }),
    { message: "Variant tiers need unique minimum quantities and MRP ≥ price.", path: ["variants"] }
  )
  .refine(
    (data) =>
      !data.hasVariants ||
      data.variantPricing !== "CUSTOM" ||
      data.pricingMode !== "SINGLE" ||
      data.variants.every((v) => v.prices.length <= 1 && (v.prices[0]?.minQuantity ?? 1) === 1),
    { message: "Single-unit products have one price per variant with a minimum quantity of 1.", path: ["variants"] }
  )
  .refine(
    (data) =>
      !data.hasVariants ||
      data.variantPricing !== "SHARED" ||
      data.pricingMode === "ENQUIRY" ||
      data.prices.every((tier) => data.variants.every((v) => !v.isActive || tier.price + (v.priceDelta ?? 0) > 0)),
    { message: "A variant adjustment makes one of the prices zero or negative.", path: ["variants"] }
  );

export type ProductInput = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters."),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers and dashes.")
    .min(2)
    .max(160),
  image: z.string().trim(),
  parentId: z.number().int().positive().nullable(),
  isSpecial: z.boolean(),
  sortOrder: z.number().int().min(0),
  // SEO overrides (optional — empty strings fall back to derived values)
  metaTitle: z.string().trim().max(70, "Meta title must be at most 70 characters."),
  metaDescription: z
    .string()
    .trim()
    .max(165, "Meta description must be at most 165 characters."),
  metaKeywords: z.string().trim().max(255, "Meta keywords must be at most 255 characters."),
  ogImage: z.string().trim(),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const brandSchema = z.object({
  name: z.string().trim().min(2, "Brand name must be at least 2 characters."),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers and dashes.")
    .min(2)
    .max(160),
  logo: z.string().trim(),
  sortOrder: z.number().int().min(0),
});

export type BrandInput = z.infer<typeof brandSchema>;

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export const blogPostSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters."),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers and dashes.")
    .min(3)
    .max(200),
  excerpt: z.string().trim().min(20, "Excerpt must be at least 20 characters.").max(500),
  content: z.string().trim().min(50, "Content must be at least 50 characters."),
  image: z.string().trim().min(1, "Cover image is required."),
  author: z.string().trim().min(2).max(80),
  isPublished: z.boolean(),
  // SEO overrides (optional — empty strings fall back to derived values)
  metaTitle: z.string().trim().max(70, "Meta title must be at most 70 characters."),
  metaDescription: z
    .string()
    .trim()
    .max(165, "Meta description must be at most 165 characters."),
  metaKeywords: z.string().trim().max(255, "Meta keywords must be at most 255 characters."),
  ogImage: z.string().trim(),
});

export type BlogPostInput = z.infer<typeof blogPostSchema>;

// ---------------------------------------------------------------------------
// Shared admin helpers
// ---------------------------------------------------------------------------

export const idSchema = z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid id.");

export const orderStatusSchema = z.enum(["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]);

export const shipmentSchema = z.object({
  courierName: z.string().trim().min(2, "Courier name is required.").max(80),
  trackingNumber: z.string().trim().max(80),
  trackingUrl: z.string().trim().url("Tracking link must be a valid URL.").max(500).or(z.literal("")),
  expectedAt: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date picker.").or(z.literal("")),
  shipmentNote: z.string().trim().max(500),
  markShipped: z.boolean(),
});
export type ShipmentInput = z.infer<typeof shipmentSchema>;

// ---------------------------------------------------------------------------
// Store settings (seller / invoice / shipping)
// ---------------------------------------------------------------------------

export const storeSettingsSchema = z.object({
  sellerName: z.string().trim().min(2, "Legal name is required.").max(120),
  sellerGstin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Enter a valid 15-character GSTIN.")
    .or(z.literal("")),
  sellerPan: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Enter a valid 10-character PAN.")
    .or(z.literal("")),
  sellerAddress: z.string().trim().max(300),
  sellerStateCode: z.string().trim().regex(/^\d{2}$/, "Pick the state of supply."),
  sellerEmail: z.string().trim().email("Enter a valid email.").max(120).or(z.literal("")),
  sellerPhone: z.string().trim().max(20),
  invoicePrefix: z
    .string()
    .trim()
    .min(1, "Prefix is required.")
    .max(20)
    .regex(/^[A-Za-z0-9/-]+$/, "Letters, digits, / and - only."),
  freeShippingThreshold: z.number().min(0),
  volumetricDivisor: z.number().int().min(1000).max(10000),
});
export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>;

const zoneRateSchema = z.object({
  uptoGrams: z.number({ message: "Weight slab is required." }).int().min(1, "Slab must be at least 1 g."),
  price: z.number({ message: "Rate is required." }).min(0),
});

export const shippingZoneSchema = z
  .object({
    id: z.number().int().positive().nullable(),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{2,40}$/, "Code: 2–40 letters, digits, - or _."),
    name: z.string().trim().min(2, "Zone name is required.").max(80),
    states: z.array(z.string().trim().min(1)),
    etaDays: z.string().trim().min(1, "ETA is required.").max(20),
    isActive: z.boolean(),
    extraPer500g: z.number().min(0),
    rates: z.array(zoneRateSchema).min(1, "Add at least one weight slab."),
  })
  .refine(
    (z) => {
      const slabs = z.rates.map((r) => r.uptoGrams);
      return new Set(slabs).size === slabs.length;
    },
    { message: "Each slab needs a different weight limit.", path: ["rates"] },
  );
export type ShippingZoneInput = z.infer<typeof shippingZoneSchema>;
export const enquiryStatusSchema = z.enum(["NEW", "CONTACTED", "CLOSED"]);
export const bookingStatusSchema = z.enum(["PENDING", "CONFIRMED", "CANCELLED"]);
export const roleSchema = z.enum(["CUSTOMER", "ADMIN"]);

// ---------------------------------------------------------------------------
// Home page bands
// ---------------------------------------------------------------------------

/** Relative path or absolute URL — the bands link into the storefront. */
const hrefOrPath = (label: string) =>
  z
    .string()
    .trim()
    .max(200, `${label} is too long.`)
    .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//i.test(v), {
      message: `Use an internal path (/category/…) or a full https:// URL for the ${label.toLowerCase()}.`,
    });

export const homeBandSchema = z.object({
  slot: z.enum(HOME_BANNER_SLOTS),
  eyebrow: z.string().trim().max(HOME_BAND_LIMITS.eyebrow, `Keep this under ${HOME_BAND_LIMITS.eyebrow} characters.`),
  title: z
    .string()
    .trim()
    .min(4, "The band needs a headline.")
    .max(HOME_BAND_LIMITS.title, `Keep the headline under ${HOME_BAND_LIMITS.title} characters.`),
  subtitle: z
    .string()
    .trim()
    .max(HOME_BAND_LIMITS.subtitle, `Keep the support line under ${HOME_BAND_LIMITS.subtitle} characters.`),
  ctaLabel: z.string().trim().max(HOME_BAND_LIMITS.ctaLabel, `Keep the button label under ${HOME_BAND_LIMITS.ctaLabel} characters.`),
  ctaHref: hrefOrPath("button link"),
  image: z.string().trim().max(300, "Image path is too long."),
  videoUrl: videoSource("band video"),
  isActive: z.boolean(),
});
export type HomeBandInput = z.infer<typeof homeBandSchema>;
