import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Package, Store } from "lucide-react";

import { ActionSelect } from "@/components/admin/action-select";
import { ShipmentForm } from "@/components/admin/orders/shipment-form";
import { Panel, StatusBadge } from "@/components/admin/ui";
import { updateOrderStatusAction } from "@/actions/admin/engagements";
import type { getAdminOrderById } from "@/lib/queries/admin";
import { ORDER_STATUSES } from "@/lib/constants";
import { formatCurrency, formatDateTime } from "@/lib/utils";

type AdminOrderDetail = NonNullable<Awaited<ReturnType<typeof getAdminOrderById>>>;
type SubOrderPanelData = AdminOrderDetail["subOrders"][number];

/**
 * One card per vendor sub-order: items, totals, status control and courier
 * entry. Used by the admin order detail view for split (multi-vendor) orders.
 */
export function SubOrdersPanel({ subOrders }: { subOrders: SubOrderPanelData[] }) {
  return (
    <div id="fulfilment" className="space-y-6">
      {subOrders.map((sub) => (
        <Panel
          key={sub.id}
          title={sub.vendor?.name ?? "Seller"}
          description={`Sub-order ${sub.subOrderNumber ?? sub.orderNumber} · ${sub.items.length} line${sub.items.length === 1 ? "" : "s"} · ${formatCurrency(sub.total)}`}
          icon={Store}
          actions={
            <div className="flex items-center gap-2">
              {sub.vendor?.slug && (
                <Link
                  href={`/sellers/${sub.vendor.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  Storefront <ExternalLink className="size-3" aria-hidden />
                </Link>
              )}
              <StatusBadge status={sub.status} />
              <ActionSelect
                value={sub.status}
                options={ORDER_STATUSES}
                on_change={updateOrderStatusAction.bind(null, sub.id)}
                ariaLabel={`Status for ${sub.subOrderNumber ?? sub.orderNumber}`}
              />
            </div>
          }
          bodyClassName="p-0"
        >
          <ul className="divide-y">
            {sub.items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 px-5 py-3">
                <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/5">
                  {item.image ? (
                    <Image src={item.image} alt="" fill sizes="40px" className="object-cover" />
                  ) : (
                    <span className="grid size-full place-items-center text-muted-foreground">
                      <Package className="size-4" aria-hidden />
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {item.name}
                    {item.variantLabel && (
                      <span className="ml-2 rounded-md bg-primary/[0.08] px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                        {item.variantLabel}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} × {formatCurrency(item.unitPrice)}
                    {item.sku ? ` · SKU ${item.sku}` : ""}
                  </p>
                </div>
                <p className="text-sm font-semibold tabular-nums">{formatCurrency(item.lineTotal)}</p>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-surface/70 px-5 py-3 text-sm">
            <p className="text-muted-foreground">
              Subtotal {formatCurrency(sub.subtotal)} · Shipping{" "}
              {Number(sub.shipping) === 0 ? "Free" : formatCurrency(sub.shipping)}
              {sub.shippedAt ? ` · shipped ${formatDateTime(sub.shippedAt)}` : ""}
            </p>
            <p className="font-bold tabular-nums">{formatCurrency(sub.total)}</p>
          </div>

          <div className="border-t px-5 py-4">
            <ShipmentForm
              orderId={sub.id}
              status={sub.status}
              shipment={{
                courierName: sub.courierName,
                trackingNumber: sub.trackingNumber,
                trackingUrl: sub.trackingUrl,
                expectedAt: sub.expectedAt ? sub.expectedAt.toISOString().slice(0, 10) : null,
                shipmentNote: sub.shipmentNote,
              }}
            />
          </div>
        </Panel>
      ))}
    </div>
  );
}
