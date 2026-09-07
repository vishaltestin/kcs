import "server-only";

import { db } from "@/lib/db";

/**
 * Aggregated statistics for the admin dashboard charts. Order volumes here
 * are small (corporate gifting), so day/month aggregation happens in JS
 * after one indexed fetch — simpler and cheaper than SQL date truncation.
 */

export interface SalesTrendPoint {
  date: string; // ISO date (yyyy-mm-dd)
  revenue: number;
  orders: number;
}

/** Daily revenue + order count for the last `days` days (zero-filled). */
export async function getSalesTrend(days = 30): Promise<SalesTrendPoint[]> {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const orders = await db.order.findMany({
    where: { createdAt: { gte: since }, status: { not: "CANCELLED" } },
    select: { createdAt: true, total: true },
  });

  const buckets = new Map<string, { revenue: number; orders: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
  }

  for (const order of orders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.revenue += Number(order.total);
      bucket.orders += 1;
    }
  }

  return [...buckets.entries()].map(([date, { revenue, orders }]) => ({
    date,
    revenue: Math.round(revenue),
    orders,
  }));
}

export async function getOrdersByStatus() {
  const grouped = await db.order.groupBy({ by: ["status"], _count: { _all: true } });
  return grouped.map((g) => ({ status: g.status, count: g._count._all }));
}

export interface TopProductStat {
  productId: string | null;
  name: string;
  units: number;
  revenue: number;
}

/** Best-selling products by units sold (from delivered/active orders). */
export async function getTopProducts(limit = 8): Promise<TopProductStat[]> {
  const items = await db.orderItem.findMany({
    where: { order: { status: { not: "CANCELLED" } } },
    select: { productId: true, name: true, quantity: true, lineTotal: true },
  });

  const acc = new Map<string, TopProductStat>();
  for (const item of items) {
    const key = item.productId ?? `name:${item.name}`;
    const entry = acc.get(key) ?? {
      productId: item.productId,
      name: item.name,
      units: 0,
      revenue: 0,
    };
    entry.units += item.quantity;
    entry.revenue += Number(item.lineTotal);
    acc.set(key, entry);
  }

  return [...acc.values()].sort((a, b) => b.units - a.units).slice(0, limit);
}

export interface CategoryStat {
  title: string;
  products: number;
}

/** Product count per top-level category, largest first. */
export async function getCategoryDistribution(limit = 6): Promise<CategoryStat[]> {
  const rows = await db.category.findMany({
    where: { parentId: null },
    select: { title: true, _count: { select: { products: true } } },
  });
  return rows
    .map((r) => ({ title: r.title, products: r._count.products }))
    .sort((a, b) => b.products - a.products)
    .slice(0, limit);
}

export interface SignupPoint {
  month: string; // yyyy-mm
  label: string; // e.g. "Apr"
  users: number;
}

/** New user signups per month for the last `months` months (zero-filled). */
export async function getUserGrowth(months = 6): Promise<SignupPoint[]> {
  const now = new Date();
  const since = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const users = await db.user.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < months; i++) {
    const d = new Date(since.getFullYear(), since.getMonth() + i, 1);
    buckets.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 0);
  }

  for (const user of users) {
    const key = `${user.createdAt.getFullYear()}-${String(user.createdAt.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.get(key);
    if (bucket !== undefined) buckets.set(key, bucket + 1);
  }

  return [...buckets.entries()].map(([month, users]) => ({
    month,
    label: new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-IN", {
      month: "short",
      timeZone: "UTC",
    }),
    users,
  }));
}
