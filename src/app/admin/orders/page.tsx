import type { Metadata } from "next";

import { PageHeader } from "@/components/admin/ui";
import { OrdersTable, type AdminOrderRow } from "@/components/admin/orders/orders-table";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Orders" };

export default async function AdminOrdersPage() {
  const orders = await db.order.findMany({
    // Parent (customer-facing) orders only — per-vendor sub-orders are shown
    // inside their parent. Legacy single-seller orders have no sub-orders.
    where: { parentId: null },
    include: {
      items: { select: { id: true } },
      subOrders: {
        select: { id: true, vendor: { select: { name: true } }, items: { select: { id: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const rows: AdminOrderRow[] = orders.map((order) => {
    const isSplit = order.subOrders.length > 0;
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      itemCount: isSplit
        ? order.subOrders.reduce((sum, sub) => sum + sub.items.length, 0)
        : order.items.length,
      total: Number(order.total),
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      invoiceNumber: order.invoiceNumber,
      hasGst: !!order.gstNo,
      courierName: order.courierName,
      trackingNumber: order.trackingNumber,
      isSplit,
      sellers: isSplit
        ? [...new Set(order.subOrders.map((sub) => sub.vendor?.name ?? "Seller"))]
        : [],
    };
  });

  return (
    <div>
      <PageHeader
        title="Orders"
        description={`${rows.length} order${rows.length === 1 ? "" : "s"} total`}
      />
      <OrdersTable orders={rows} />
    </div>
  );
}
