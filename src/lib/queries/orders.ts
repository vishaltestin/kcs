import "server-only";

import { db } from "@/lib/db";

import type { OrderWithItems } from "@/types";

export async function getUserOrders(userId: string) {
  return db.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getOrderByNumber(
  orderNumber: string,
  userId?: string
): Promise<OrderWithItems | null> {
  return db.order.findFirst({
    where: userId ? { orderNumber, userId } : { orderNumber },
    include: { items: true },
  });
}
