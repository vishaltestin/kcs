import "server-only";

import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

/**
 * Customer-facing order reads. Orders placed since the multi-vendor launch
 * are a parent + one sub-order per vendor; legacy orders carry their items
 * directly. `displayItems` and `shipments` normalise both shapes so views
 * don't branch on history.
 */

const orderInclude = {
  items: true,
  subOrders: {
    orderBy: { subOrderNumber: "asc" as const },
    include: {
      items: true,
      vendor: { select: { id: true, name: true, slug: true } },
    },
  },
} satisfies Prisma.OrderInclude;

export type SubOrderView = Prisma.OrderGetPayload<{
  include: {
    items: true;
    vendor: { select: { id: true; name: true; slug: true } };
  };
}>;

export type CustomerOrder = Omit<RawOrder, "subOrders"> & {
  subOrders: SubOrderView[];
  /** True when the order was split into per-vendor sub-orders. */
  isSplit: boolean;
  /** All line items, flattened from sub-orders (or own items for legacy orders). */
  displayItems: SubOrderView["items"];
  /** Per-leg fulfilment info — one entry per sub-order, empty for legacy orders. */
  shipments: {
    id: string;
    subOrderNumber: string | null;
    vendorName: string;
    vendorSlug: string | null;
    status: string;
    courierName: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
    shippedAt: Date | null;
    expectedAt: Date | null;
    deliveredAt: Date | null;
    shipmentNote: string | null;
    total: number;
    itemCount: number;
  }[];
};

type RawOrder = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

function toCustomerOrder(order: RawOrder): CustomerOrder {
  const { subOrders, ...rest } = order;
  const subs: SubOrderView[] = subOrders;
  const isSplit = subs.length > 0;
  return {
    ...rest,
    subOrders: subs,
    isSplit,
    displayItems: isSplit ? subs.flatMap((sub) => sub.items) : order.items,
    shipments: subs.map((sub) => ({
      id: sub.id,
      subOrderNumber: sub.subOrderNumber,
      vendorName: sub.vendor?.name ?? "Seller",
      vendorSlug: sub.vendor?.slug ?? null,
      status: sub.status,
      courierName: sub.courierName,
      trackingNumber: sub.trackingNumber,
      trackingUrl: sub.trackingUrl,
      shippedAt: sub.shippedAt,
      expectedAt: sub.expectedAt,
      deliveredAt: sub.deliveredAt,
      shipmentNote: sub.shipmentNote,
      total: Number(sub.total),
      itemCount: sub.items.reduce((sum, item) => sum + item.quantity, 0),
    })),
  };
}

export async function getUserOrders(userId: string): Promise<CustomerOrder[]> {
  const orders = await db.order.findMany({
    where: { userId, parentId: null },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return orders.map(toCustomerOrder);
}

export async function getOrderByNumber(
  orderNumber: string,
  userId?: string,
): Promise<CustomerOrder | null> {
  const order = await db.order.findFirst({
    where: userId ? { orderNumber, userId } : { orderNumber },
    include: orderInclude,
  });
  return order ? toCustomerOrder(order) : null;
}
