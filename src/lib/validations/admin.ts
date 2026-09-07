import { z } from "zod";

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

export const productSchema = z
  .object({
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
    video: z.string().trim().url("Video must be a valid URL.").or(z.literal("")),
    delivery: z.string().trim().max(500),
    stock: z.number({ message: "Stock is required." }).int().min(0),
    isActive: z.boolean(),
    isNew: z.boolean(),
    isFeatured: z.boolean(),
    isBestSeller: z.boolean(),
    prices: z.array(priceTierSchema).min(1, "Add at least one price tier."),
    specs: z.array(specSchema),
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
export const enquiryStatusSchema = z.enum(["NEW", "CONTACTED", "CLOSED"]);
export const bookingStatusSchema = z.enum(["PENDING", "CONFIRMED", "CANCELLED"]);
export const roleSchema = z.enum(["CUSTOMER", "ADMIN"]);
