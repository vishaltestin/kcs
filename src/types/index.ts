import type { Prisma } from "@prisma/client";

/**
 * Shared application types. Most entities are derived from the Prisma schema
 * so the client/server boundary stays type-safe.
 */

export type ProductPriceTier = {
  minQuantity: number;
  price: number;
  mrp: number;
};

/** Serialisable product shape passed to client components. */
export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  image: string;
  introtext: string | null;
  brand: string | null;
  brandId: number | null;
  isNew: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isActive: boolean;
  stock: number;
  price: number | null;
  mrpPrice: number | null;
  minQuantity: number;
};

export type ProductDetail = ProductListItem & {
  sku: string | null;
  description: string | null;
  video: string | null;
  delivery: string | null;
  /** SEO overrides (nullable — storefront falls back to name/introtext/image). */
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  ogImage: string | null;
  images: string[];
  categories: { id: number; title: string; slug: string }[];
  prices: ProductPriceTier[];
  specs: { id: number; label: string; value: string }[];
  rating: { average: number; count: number } | null;
};

export type BlogCard = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  image: string;
  publishedAt: string;
};

export type CategoryNode = {
  id: number;
  title: string;
  slug: string;
  image: string | null;
  isSpecial: boolean;
  children: CategoryNode[];
};

export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

/** Cart item stored in the client-side zustand store. */
export type CartItem = {
  id: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  mrp: number;
  qty: number;
  minQuantity: number;
};

export type WishlistItem = {
  id: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  brand: string | null;
};

export type ReviewCard = {
  id: number;
  authorName: string;
  rating: number;
  title: string | null;
  comment: string;
  createdAt: string;
};

/** Narrowed Prisma types re-exported for pages. */
export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    brand: true;
    images: true;
    prices: true;
    specs: true;
    categories: { include: { category: true } };
    reviews: { where: { isApproved: true }; select: { rating: true } };
  };
}>;

export type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>;
