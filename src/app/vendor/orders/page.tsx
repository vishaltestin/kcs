import type { Metadata } from "next";

import { PageHeader } from "@/components/admin/ui";
import { VendorOrdersTable, type VendorOrderRow } from "@/components/vendor/orders-table";
import { requireVendor } from "@/lib/auth/guards";
import { getVendorSubOrders } from "@/lib/queries/vendor";

export const metadata: Metadata = { title: "Orders" };

export default async function VendorOrdersPage() {
  const { vendor } = await requireVendor();
  const { orders, total } = await getVendorSubOrders({ vendorId: vendor.id, perPage: 200 });

  const rows: VendorOrderRow[] = orders.map((order) => ({
    id: order.id,
    subOrderNumber: order.subOrderNumber,
    orderNumber: order.orderNumber,
    parentOrderNumber: order.parent?.orderNumber ?? null,
    customerName: order.customerName,
    customerCity: order.shippingCity,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    total: Number(order.total),
    status: order.status,
    createdAt: order.createdAt,
    firstItemImage: order.items[0]?.image ?? null,
  }));

  return (
    <div>
      <PageHeader
        title="Orders"
        description={`${total} sub-order${total === 1 ? "" : "s"} assigned to you for fulfilment`}
      />
      <VendorOrdersTable orders={rows} />
    </div>
  );
}
