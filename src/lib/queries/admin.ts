import "server-only";

import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

/**
 * Data queries for the admin console.
 */

export async function getDashboardStats() {
  const now = new Date();
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    productCount,
    activeProductCount,
    categoryCount,
    brandCount,
    orderCount,
    pendingOrderCount,
    enquiryCount,
    newEnquiryCount,
    userCount,
    customerCount,
    subscriberCount,
    pendingReviews,
    unreadMessages,
    pendingBookings,
    revenueAgg,
    monthlyRevenueAgg,
  ] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { isActive: true } }),
    db.category.count(),
    db.brand.count(),
    db.order.count(),
    db.order.count({ where: { status: "PENDING" } }),
    db.bulkEnquiry.count(),
    db.bulkEnquiry.count({ where: { status: "NEW" } }),
    db.user.count(),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.newsletterSubscriber.count(),
    db.review.count({ where: { isApproved: false } }),
    db.contactMessage.count({ where: { isRead: false } }),
    db.meetingBooking.count({ where: { status: "PENDING" } }),
    db.order.aggregate({ _sum: { total: true }, where: { status: { not: "CANCELLED" } } }),
    db.order.aggregate({
      _sum: { total: true },
      where: { status: { not: "CANCELLED" }, createdAt: { gte: last30 } },
    }),
  ]);

  return {
    productCount,
    activeProductCount,
    categoryCount,
    brandCount,
    orderCount,
    pendingOrderCount,
    enquiryCount,
    newEnquiryCount,
    userCount,
    customerCount,
    subscriberCount,
    pendingReviews,
    unreadMessages,
    pendingBookings,
    revenue: Number(revenueAgg._sum.total ?? 0),
    monthlyRevenue: Number(monthlyRevenueAgg._sum.total ?? 0),
  };
}

export async function getRecentOrders(limit = 8) {
  return db.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { items: { select: { id: true } } },
  });
}

export async function getRecentEnquiries(limit = 6) {
  return db.bulkEnquiry.findMany({ orderBy: { createdAt: "desc" }, take: limit });
}

export async function getLowStockProducts(threshold = 50, limit = 6) {
  return db.product.findMany({
    where: { stock: { lte: threshold }, isActive: true },
    orderBy: { stock: "asc" },
    take: limit,
    select: { id: true, name: true, slug: true, stock: true, image: true },
  });
}

// ---------------------------------------------------------------------------
// Products admin (paginated + search)
// ---------------------------------------------------------------------------

const adminProductInclude = {
  brand: { select: { name: true } },
  categories: { include: { category: { select: { title: true } } } },
  prices: { orderBy: { minQuantity: "asc" as const } },
  specs: true,
  images: { orderBy: { sortOrder: "asc" as const } },
} satisfies Prisma.ProductInclude;

type AdminProductRow = Prisma.ProductGetPayload<{ include: typeof adminProductInclude }>;

/**
 * Serialisable product shape for admin client components — Prisma `Decimal`
 * objects cannot cross the RSC boundary, so prices are converted to numbers.
 */
export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  brandId: number | null;
  introtext: string | null;
  description: string | null;
  image: string;
  video: string | null;
  delivery: string | null;
  stock: number;
  basePrice: number;
  baseMrp: number;
  isActive: boolean;
  isNew: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  createdAt: Date;
  updatedAt: Date;
  brand: { name: string } | null;
  categories: { categoryId: number; category: { title: string } }[];
  prices: { id: number; minQuantity: number; price: number; mrp: number }[];
  specs: { id: number; label: string; value: string }[];
  images: { id: number; url: string; sortOrder: number }[];
};

function toAdminProduct(p: AdminProductRow): AdminProduct {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    brandId: p.brandId,
    introtext: p.introtext,
    description: p.description,
    image: p.image,
    video: p.video,
    delivery: p.delivery,
    stock: p.stock,
    basePrice: Number(p.basePrice),
    baseMrp: Number(p.baseMrp),
    isActive: p.isActive,
    isNew: p.isNew,
    isFeatured: p.isFeatured,
    isBestSeller: p.isBestSeller,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    brand: p.brand,
    categories: p.categories.map((c) => ({ categoryId: c.categoryId, category: { title: c.category.title } })),
    prices: p.prices.map((t) => ({ id: t.id, minQuantity: t.minQuantity, price: Number(t.price), mrp: Number(t.mrp) })),
    specs: p.specs.map((s) => ({ id: s.id, label: s.label, value: s.value })),
    images: p.images.map((i) => ({ id: i.id, url: i.url, sortOrder: i.sortOrder })),
  };
}

export async function getAdminProducts({
  search = "",
  page = 1,
  perPage = 15,
}: {
  search?: string;
  page?: number;
  perPage?: number;
}) {
  const where: Prisma.ProductWhereInput = search
    ? {
        OR: [
          { name: { contains: search } },
          { slug: { contains: search } },
          { sku: { contains: search } },
          { brand: { name: { contains: search } } },
        ],
      }
    : {};

  const [total, rows] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      include: adminProductInclude,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return {
    products: rows.map(toAdminProduct),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getAdminProductById(id: string) {
  return db.product.findUnique({
    where: { id },
    include: {
      brand: true,
      images: true,
      prices: { orderBy: { minQuantity: "asc" } },
      specs: true,
      categories: { select: { categoryId: true } },
    },
  });
}

/**
 * Product in the exact shape the ProductForm expects (category ids as a flat
 * array, gallery as url strings, prices as numbers).
 */
export async function getAdminProductForEdit(id: string) {
  const row = await db.product.findUnique({ where: { id }, include: adminProductInclude });
  if (!row) return null;
  const p = toAdminProduct(row);
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    brandId: p.brandId,
    introtext: p.introtext,
    description: p.description,
    image: p.image,
    video: p.video,
    delivery: p.delivery,
    stock: p.stock,
    isActive: p.isActive,
    isNew: p.isNew,
    isFeatured: p.isFeatured,
    isBestSeller: p.isBestSeller,
    metaTitle: row.metaTitle ?? "",
    metaDescription: row.metaDescription ?? "",
    metaKeywords: row.metaKeywords ?? "",
    ogImage: row.ogImage ?? "",
    categoryIds: p.categories.map((c) => c.categoryId),
    images: p.images.map((i) => i.url),
    prices: p.prices.map(({ minQuantity, price, mrp }) => ({ minQuantity, price, mrp })),
    specs: p.specs.map(({ label, value }) => ({ label, value })),
  };
}

// ---------------------------------------------------------------------------
// Other listings
// ---------------------------------------------------------------------------

export async function getAdminCategories() {
  const all = await db.category.findMany({
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }, { title: "asc" }],
    include: { _count: { select: { products: true, children: true } } },
  });
  return all;
}

export async function getAdminBrands() {
  return db.brand.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });
}

export async function getAdminOrders({ status, page = 1, perPage = 15 }: { status?: string; page?: number; perPage?: number }) {
  const where: Prisma.OrderWhereInput =
    status && ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"].includes(status)
      ? { status: status as Prisma.EnumOrderStatusFilter["equals"] }
      : {};

  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      include: { items: { select: { id: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return { orders, total, page, totalPages: Math.max(1, Math.ceil(total / perPage)) };
}

export async function getAdminOrderById(id: string) {
  return db.order.findUnique({ where: { id }, include: { items: true, user: { select: { email: true } } } });
}

export async function getAdminEnquiries(status?: string) {
  const where: Prisma.BulkEnquiryWhereInput =
    status && ["NEW", "CONTACTED", "CLOSED"].includes(status)
      ? { status: status as Prisma.EnumEnquiryStatusFilter["equals"] }
      : {};

  return db.bulkEnquiry.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 });
}

export async function getAdminBookings() {
  return db.meetingBooking.findMany({ orderBy: [{ date: "asc" }, { timeSlot: "asc" }], take: 100 });
}

export async function getAdminMessages() {
  return db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
}

export async function getAdminBlogPosts() {
  return db.blogPost.findMany({ orderBy: { updatedAt: "desc" } });
}

export async function getAdminUsers(search = "") {
  const where: Prisma.UserWhereInput = search
    ? {
        OR: [
          { email: { contains: search } },
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { companyName: { contains: search } },
        ],
      }
    : {};

  return db.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      emailVerifiedAt: true,
      companyName: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
  });
}

export async function getAdminReviews() {
  return db.review.findMany({
    orderBy: [{ isApproved: "asc" }, { createdAt: "desc" }],
    take: 200,
    include: { product: { select: { name: true, slug: true } } },
  });
}

export async function getAdminSubscribers() {
  return db.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" } });
}

// ---------------------------------------------------------------------------
// Entity for-edit lookups (dedicated edit pages)
// ---------------------------------------------------------------------------

export async function getAdminCategoryForEdit(id: number) {
  return db.category.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      image: true,
      parentId: true,
      isSpecial: true,
      sortOrder: true,
      metaTitle: true,
      metaDescription: true,
      metaKeywords: true,
      ogImage: true,
    },
  });
}

export async function getAdminBrandForEdit(id: number) {
  return db.brand.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, logo: true, sortOrder: true },
  });
}

export async function getAdminBlogPostForEdit(id: number) {
  return db.blogPost.findUnique({ where: { id } });
}
