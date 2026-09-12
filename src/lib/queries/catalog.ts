import "server-only";

import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import type {
  CategoryNode,
  ProductDetail,
  ProductListItem,
  ProductWithRelations,
} from "@/types";
import { PRICE_FILTER_OPTIONS } from "@/lib/constants";
import { priceRange, resolveVariantTiers, variantLabel, type StorefrontVariant } from "@/lib/variants";

/**
 * Server-side catalog queries. Every storefront page fetches its data here
 * (RSC / server components only — no client-side API calls).
 */

const productInclude = {
  brand: true,
  images: true,
  prices: true,
  specs: true,
  categories: { include: { category: true } },
  reviews: { where: { isApproved: true }, select: { rating: true } },
  options: true,
  variants: { include: { prices: true } },
} satisfies Prisma.ProductInclude;

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function toStorefrontVariants(p: ProductWithRelations): StorefrontVariant[] {
  const axes = toOptionAxes(p);
  return [...p.variants]
    .filter((v) => v.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((v) => {
      // Shared pricing → product tiers ± the variant's adjustment; custom → its own table.
      const tiers = resolveVariantTiers(p.variantPricing, p.prices, v);
      const base = tiers[0];
      const attributes = (v.attributes ?? {}) as Record<string, string>;
      return {
        id: v.id,
        attributes,
        label: v.label || variantLabel(attributes, axes),
        sku: v.sku,
        image: v.image,
        stock: v.stock,
        price: base ? base.price : Number(v.basePrice) > 0 ? Number(v.basePrice) : null,
        mrp: base ? base.mrp : Number(v.baseMrp) > 0 ? Number(v.baseMrp) : null,
        minQuantity: p.pricingMode === "SINGLE" ? 1 : (base?.minQuantity ?? 1),
        prices: tiers,
      };
    });
}

function toOptionAxes(p: ProductWithRelations): { name: string; values: string[] }[] {
  return [...p.options]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((o) => ({ name: o.name, values: Array.isArray(o.values) ? (o.values as string[]) : [] }))
    .filter((o) => o.values.length > 0);
}

export function toProductListItem(p: ProductWithRelations): ProductListItem {
  const sorted = [...p.prices].sort((a, b) => a.minQuantity - b.minQuantity);
  const base = sorted[0];
  const variants = p.hasVariants ? toStorefrontVariants(p) : [];
  const range = variants.length > 0 && p.pricingMode !== "ENQUIRY" ? priceRange(variants) : null;
  const isEnquiry =
    p.pricingMode === "ENQUIRY" || (variants.length === 0 && !base && Number(p.basePrice) <= 0);
  const hasBasePrice = !isEnquiry && Number(p.basePrice) > 0;

  if (range) {
    // Variant products: card price is the cheapest variant; stock is the sum.
    const cheapest = variants.find((v) => v.price === range.min);
    return {
      pricingMode: p.pricingMode,
      variantCount: variants.length,
      priceRange: range.min === range.max ? null : range,
      id: p.id,
      name: p.name,
      slug: p.slug,
      image: p.image,
      introtext: p.introtext,
      brand: p.brand?.name ?? null,
      brandId: p.brandId,
      isNew: p.isNew,
      isFeatured: p.isFeatured,
      isBestSeller: p.isBestSeller,
      isActive: p.isActive,
      stock: variants.reduce((sum, v) => sum + v.stock, 0),
      price: range.min,
      mrpPrice: cheapest?.mrp ?? null,
      minQuantity: p.pricingMode === "SINGLE" ? 1 : (cheapest?.minQuantity ?? 1),
    };
  }

  return {
    pricingMode: isEnquiry ? "ENQUIRY" : p.pricingMode,
    variantCount: variants.length,
    priceRange: null,
    id: p.id,
    name: p.name,
    slug: p.slug,
    image: p.image,
    introtext: p.introtext,
    brand: p.brand?.name ?? null,
    brandId: p.brandId,
    isNew: p.isNew,
    isFeatured: p.isFeatured,
    isBestSeller: p.isBestSeller,
    isActive: p.isActive,
    stock: p.stock,
    price: isEnquiry ? null : hasBasePrice ? Number(p.basePrice) : base ? Number(base.price) : null,
    mrpPrice: isEnquiry ? null : hasBasePrice ? Number(p.baseMrp) : base ? Number(base.mrp) : null,
    minQuantity: isEnquiry ? 1 : p.pricingMode === "SINGLE" ? 1 : (base?.minQuantity ?? 1),
  };
}

export function toProductDetail(p: ProductWithRelations): ProductDetail {
  const sorted = [...p.prices].sort((a, b) => a.minQuantity - b.minQuantity);
  const ratings = p.reviews.map((r) => r.rating);

  return {
    ...toProductListItem(p),
    sku: p.sku,
    description: p.description,
    video: p.video,
    delivery: p.delivery,
    metaTitle: p.metaTitle,
    metaDescription: p.metaDescription,
    metaKeywords: p.metaKeywords,
    ogImage: p.ogImage,
    images: [p.image, ...p.images.map((i) => i.url)].filter(
      (url, index, arr) => Boolean(url) && arr.indexOf(url) === index
    ),
    categories: p.categories.map((c) => ({
      id: c.category.id,
      title: c.category.title,
      slug: c.category.slug,
    })),
    prices: sorted.map((tier) => ({
      minQuantity: tier.minQuantity,
      price: Number(tier.price),
      mrp: Number(tier.mrp),
    })),
    specs: p.specs.map((s) => ({ id: s.id, label: s.label, value: s.value })),
    hsnCode: p.hsnCode,
    gstRate: Number(p.gstRate),
    weightGrams: p.weightGrams,
    dimensionsCm:
      Number(p.lengthCm) > 0 && Number(p.widthCm) > 0 && Number(p.heightCm) > 0
        ? { length: Number(p.lengthCm), width: Number(p.widthCm), height: Number(p.heightCm) }
        : null,
    options: p.hasVariants ? toOptionAxes(p) : [],
    variants: p.hasVariants ? toStorefrontVariants(p) : [],
    rating:
      ratings.length > 0
        ? {
            average: ratings.reduce((a, b) => a + b, 0) / ratings.length,
            count: ratings.length,
          }
        : null,
  };
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function getCategoryTree(): Promise<CategoryNode[]> {
  const all = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });

  const roots = all.filter((c) => c.parentId === null);
  const build = (parent: (typeof all)[number]): CategoryNode => ({
    id: parent.id,
    title: parent.title,
    slug: parent.slug,
    image: parent.image,
    isSpecial: parent.isSpecial,
    children: all
      .filter((c) => c.parentId === parent.id)
      .map(build),
  });

  return roots.map(build);
}

export async function getCategoryMenus() {
  const tree = await getCategoryTree();
  return {
    productCategories: tree.filter((c) => !c.isSpecial),
    specialCategories: tree.filter((c) => c.isSpecial),
  };
}

export async function getAllCategoriesFlat() {
  return db.category.findMany({
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }, { title: "asc" }],
  });
}

export async function getCategoryBySlug(slug: string) {
  const category = await db.category.findUnique({ where: { slug } });
  if (!category) return null;

  // Include descendant ids so children products show on the parent page.
  const children = await db.category.findMany({
    where: { parentId: category.id },
    select: { id: true },
  });

  return {
    category,
    categoryIds: [category.id, ...children.map((c) => c.id)],
  };
}

// ---------------------------------------------------------------------------
// Brands
// ---------------------------------------------------------------------------

export async function getBrands(limit = 100) {
  return db.brand.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: limit,
  });
}

// ---------------------------------------------------------------------------
// Home page
// ---------------------------------------------------------------------------

export async function getProductsByType(
  type: "New" | "Featured" | "BestSeller",
  limit = 10
): Promise<ProductListItem[]> {
  const where =
    type === "New"
      ? { isActive: true, isNew: true }
      : type === "Featured"
        ? { isActive: true, isFeatured: true }
        : { isActive: true, isBestSeller: true };

  const products = await db.product.findMany({
    where,
    include: productInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return products.map(toProductListItem);
}

export async function getRelatedProducts(productId: string, categoryIds: number[], limit = 8) {
  const products = await db.product.findMany({
    where: {
      isActive: true,
      id: { not: productId },
      categories: categoryIds.length > 0 ? { some: { categoryId: { in: categoryIds } } } : undefined,
    },
    include: productInclude,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  return products.map(toProductListItem);
}

// ---------------------------------------------------------------------------
// Product listing with filters
// ---------------------------------------------------------------------------

export type ProductFilters = {
  search?: string;
  categoryIds?: number[];
  brandIds?: number[];
  priceRanges?: { min: number; max: number | null }[];
  productType?: "new" | "featured" | "bestseller";
  sort?: "newest" | "price-asc" | "price-desc" | "name-asc";
  page?: number;
  perPage?: number;
};

export function parsePriceRangeParams(values: string[]): { min: number; max: number | null }[] {
  const ranges: { min: number; max: number | null }[] = [];
  for (const value of values) {
    const option = PRICE_FILTER_OPTIONS.find((o) => o.label === value);
    if (option) ranges.push({ min: option.min, max: option.max });
  }
  return ranges;
}

/** Defensive id list: drops NaN / negative / non-integer / >int32 values before they reach Prisma. */
function safeIds(ids: number[] | undefined): number[] {
  return (ids ?? []).filter((n) => Number.isInteger(n) && n > 0 && n <= 2_147_483_647);
}

export async function getFilteredProducts(rawFilters: ProductFilters) {
  const filters: ProductFilters = {
    ...rawFilters,
    categoryIds: safeIds(rawFilters.categoryIds),
    brandIds: safeIds(rawFilters.brandIds),
    // Trim and cap free-text search so pathological inputs can't build huge LIKE queries.
    search: rawFilters.search?.trim().slice(0, 100) || undefined,
  };
  const rawPage = Number(filters.page ?? 1);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.min(Math.floor(rawPage), 10_000) : 1;
  const perPage = Math.min(Math.max(1, filters.perPage ?? 12), 60);

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(filters.productType === "new"
      ? { isNew: true }
      : filters.productType === "featured"
        ? { isFeatured: true }
        : filters.productType === "bestseller"
          ? { isBestSeller: true }
          : {}),
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search } },
            { introtext: { contains: filters.search } },
            { brand: { name: { contains: filters.search } } },
            { categories: { some: { category: { title: { contains: filters.search } } } } },
          ],
        }
      : {}),
    ...(filters.categoryIds && filters.categoryIds.length > 0
      ? { categories: { some: { categoryId: { in: filters.categoryIds } } } }
      : {}),
    ...(filters.brandIds && filters.brandIds.length > 0
      ? { brandId: { in: filters.brandIds } }
      : {}),
    ...(filters.priceRanges && filters.priceRanges.length > 0
      ? {
          AND: filters.priceRanges.map((range) => ({
            basePrice: {
              gte: range.min,
              ...(range.max !== null ? { lte: range.max } : {}),
            },
          })),
        }
      : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    filters.sort === "price-asc"
      ? { basePrice: "asc" }
      : filters.sort === "price-desc"
        ? { basePrice: "desc" }
        : filters.sort === "name-asc"
          ? { name: "asc" }
          : { createdAt: "desc" };

  // Count first so an out-of-range `?page=` snaps to the last real page
  // instead of rendering "Showing 11977–43 of 43".
  const total = await db.product.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(page, totalPages);

  const products = await db.product.findMany({
    where,
    include: productInclude,
    orderBy,
    skip: (currentPage - 1) * perPage,
    take: perPage,
  });

  return {
    items: products.map(toProductListItem),
    total,
    page: currentPage,
    perPage,
    totalPages,
  };
}

// ---------------------------------------------------------------------------
// Product detail
// ---------------------------------------------------------------------------

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const product = await db.product.findUnique({
    where: { slug },
    include: productInclude,
  });

  return product ? toProductDetail(product) : null;
}

export async function getProductReviews(productId: string) {
  return db.review.findMany({
    where: { productId, isApproved: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

/** Lightweight suggestion search for the navbar (server action friendly). */
export type SearchSuggestions = {
  products: {
    id: string;
    name: string;
    slug: string;
    image: string;
    brand: string;
    category: string;
    price: number | null;
    pricingMode: "SINGLE" | "BULK" | "ENQUIRY";
  }[];
  categories: { id: number; title: string; slug: string; image: string | null; parent: string | null; count: number }[];
  brands: { id: number; name: string; slug: string | null; count: number }[];
};

/** Products, categories and brands matching `query` — powers the header search panel. */
export async function searchSuggestions(query: string, limit = 6): Promise<SearchSuggestions> {
  const q = query.trim().slice(0, 100);
  if (q.length < 2) return { products: [], categories: [], brands: [] };

  const [products, categories, brands] = await Promise.all([
    db.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q } },
          { sku: { equals: q } },
          { brand: { name: { contains: q } } },
          { categories: { some: { category: { title: { contains: q } } } } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        basePrice: true,
        pricingMode: true,
        brand: { select: { name: true } },
        categories: { take: 1, select: { category: { select: { title: true } } } },
      },
      orderBy: [{ isBestSeller: "desc" }, { isFeatured: "desc" }, { createdAt: "desc" }],
      take: limit,
    }),
    db.category.findMany({
      where: { title: { contains: q } },
      select: {
        id: true,
        title: true,
        slug: true,
        image: true,
        parent: { select: { title: true } },
        _count: { select: { products: true } },
      },
      orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
      take: 5,
    }),
    db.brand.findMany({
      where: { name: { contains: q } },
      select: { id: true, name: true, slug: true, _count: { select: { products: true } } },
      orderBy: { sortOrder: "asc" },
      take: 4,
    }),
  ]);

  return {
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      image: p.image,
      brand: p.brand?.name ?? "KCS G-Mart",
      category: p.categories[0]?.category.title ?? "Corporate gifts",
      price: p.pricingMode === "ENQUIRY" || Number(p.basePrice) <= 0 ? null : Number(p.basePrice),
      pricingMode: p.pricingMode,
    })),
    categories: categories.map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      image: c.image,
      parent: c.parent?.title ?? null,
      count: c._count.products,
    })),
    brands: brands.map((b) => ({ id: b.id, name: b.name, slug: b.slug, count: b._count.products })),
  };
}
