import type { Metadata } from "next";

import { PageHeader } from "@/components/admin/ui";
import { OrdersTable, type AdminOrderRow } from "@/components/admin/orders/orders-table";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Orders" };

export default async function AdminOrdersPage() {
  const orders = await db.order.findMany({
    include: { items: { select: { id: true } } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const rows: AdminOrderRow[] = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    itemCount: order.items.length,
    total: Number(order.total),
    status: order.status,
    createdAt: order.createdAt,
  }));

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
