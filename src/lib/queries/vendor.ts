import "server-only";

import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { toAdminProduct, adminProductInclude, type AdminProduct } from "@/lib/queries/admin";

/**
 * Vendor-scoped data queries for the seller console. Every read filters by
 * the authenticated vendor's id — vendors never see each other's data.
 */

export async function getVendorDashboard(vendorId: string) {
  const now = new Date();
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    productCount,
    activeProductCount,
    lowStock,
    pendingSubOrders,
    subOrderCount,
    revenueAgg,
    monthlyRevenueAgg,
    unitsAgg,
    recentSubOrders,
  ] = await Promise.all([
    db.product.count({ where: { vendorId } }),
    db.product.count({ where: { vendorId, isActive: true } }),
    db.product.count({ where: { vendorId, isActive: true, stock: { gt: 0, lte: 25 } } }),
    db.order.count({ where: { vendorId, parentId: { not: null }, status: "PENDING" } }),
    db.order.count({ where: { vendorId, parentId: { not: null } } }),
    db.order.aggregate({
      _sum: { total: true },
      where: { vendorId, parentId: { not: null }, status: { not: "CANCELLED" } },
    }),
    db.order.aggregate({
      _sum: { total: true },
      where: { vendorId, parentId: { not: null }, status: { not: "CANCELLED" }, createdAt: { gte: last30 } },
    }),
    db.orderItem.aggregate({
      _sum: { quantity: true },
      where: { order: { vendorId, parentId: { not: null }, status: { not: "CANCELLED" } } },
    }),
    db.order.findMany({
      where: { vendorId, parentId: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { items: { select: { id: true } } },
    }),
  ]);

  return {
    productCount,
    activeProductCount,
    lowStock,
    pendingSubOrders,
    subOrderCount,
    revenue: Number(revenueAgg._sum.total ?? 0),
    monthlyRevenue: Number(monthlyRevenueAgg._sum.total ?? 0),
    unitsSold: unitsAgg._sum.quantity ?? 0,
    recentSubOrders,
  };
}

export async function getVendorProducts({
  vendorId,
  search = "",
  page = 1,
  perPage = 15,
}: {
  vendorId: string;
  search?: string;
  page?: number;
  perPage?: number;
}) {
  const where: Prisma.ProductWhereInput = {
    vendorId,
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { slug: { contains: search } },
            { sku: { contains: search } },
            { brand: { name: { contains: search } } },
          ],
        }
      : {}),
  };

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

/**
 * The product in the ProductForm's shape, but ONLY when it belongs to this
 * vendor — otherwise null (renders a 404).
 */
export async function getVendorProductForEdit(vendorId: string, productId: string) {
  const row = await db.product.findFirst({
    where: { id: productId, vendorId },
    include: adminProductInclude,
  });
  if (!row) return null;
  const p = toAdminProduct(row);
  return {
    id: p.id,
    vendorId: p.vendorId,
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
    trackStock: p.trackStock,
    pricingMode: row.pricingMode,
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
    hsnCode: row.hsnCode ?? "",
    gstRate: Number(row.gstRate),
    weightGrams: row.weightGrams,
    lengthCm: Number(row.lengthCm) || null,
    widthCm: Number(row.widthCm) || null,
    heightCm: Number(row.heightCm) || null,
    hasVariants: row.hasVariants,
    variantPricing: row.variantPricing,
    options: row.options.map((o) => ({
      name: o.name,
      values: Array.isArray(o.values) ? (o.values as unknown[]).map(String) : [],
    })),
    variants: row.variants.map((v) => ({
      id: v.id,
      attributes: (v.attributes && typeof v.attributes === "object" && !Array.isArray(v.attributes)
        ? (v.attributes as Record<string, unknown>)
        : {}) as Record<string, string>,
      label: v.label,
      sku: v.sku ?? "",
      image: v.image ?? "",
      stock: v.stock,
      trackStock: v.trackStock,
      isActive: v.isActive,
      priceDelta: Number(v.priceDelta),
      prices: v.prices.map(({ minQuantity, price, mrp }) => ({ minQuantity, price: Number(price), mrp: Number(mrp) })),
      weightGrams: v.weightGrams,
      lengthCm: v.lengthCm === null ? null : Number(v.lengthCm),
      widthCm: v.widthCm === null ? null : Number(v.widthCm),
      heightCm: v.heightCm === null ? null : Number(v.heightCm),
    })),
  };
}

export type VendorSubOrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export async function getVendorSubOrders({
  vendorId,
  status,
  page = 1,
  perPage = 15,
}: {
  vendorId: string;
  status?: string;
  page?: number;
  perPage?: number;
}) {
  const where: Prisma.OrderWhereInput = {
    vendorId,
    parentId: { not: null },
    ...(status && ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"].includes(status)
      ? { status: status as Prisma.EnumOrderStatusFilter["equals"] }
      : {}),
  };

  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        items: { select: { id: true, name: true, image: true, quantity: true } },
        parent: { select: { orderNumber: true } },
      },
    }),
  ]);

  return { orders, total, page, totalPages: Math.max(1, Math.ceil(total / perPage)) };
}

export async function getVendorSubOrderById(vendorId: string, orderId: string) {
  return db.order.findFirst({
    where: { id: orderId, vendorId, parentId: { not: null } },
    include: {
      items: true,
      parent: { select: { orderNumber: true, notes: true } },
    },
  });
}

export async function getVendorProfile(vendorId: string) {
  return db.vendor.findUnique({
    where: { id: vendorId },
    select: {
      id: true,
      name: true,
      slug: true,
      legalName: true,
      email: true,
      phone: true,
      gstin: true,
      pan: true,
      address: true,
      city: true,
      state: true,
      pincode: true,
      stateCode: true,
      logo: true,
      description: true,
      status: true,
      createdAt: true,
    },
  });
}

export type { AdminProduct };
