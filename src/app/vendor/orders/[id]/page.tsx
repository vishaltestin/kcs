import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Package,
  PackageCheck,
  Truck,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { ShipmentForm } from "@/components/admin/orders/shipment-form";
import { requireVendor } from "@/lib/auth/guards";
import { getVendorSubOrderById } from "@/lib/queries/vendor";
import {
  vendorConfirmSubOrderAction,
  vendorDeliverSubOrderAction,
  vendorUpdateShipmentAction,
} from "@/actions/vendor/orders";
import { ConfirmButton } from "@/components/data-table/row-actions";
import { GST_STATE_CODES } from "@/lib/tax";
import { formatGrams } from "@/lib/shipping";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Order Details" };

export default async function VendorOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { vendor } = await requireVendor();

  const order = await getVendorSubOrderById(vendor.id, id);
  if (!order) notFound();

  const pieces = order.items.reduce((s, i) => s + i.quantity, 0);
  const totalTax = Number(order.cgst) + Number(order.sgst) + Number(order.igst);
  const interState = Number(order.igst) > 0;

  return (
    <div>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/vendor/orders">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden /> All orders
          </Link>
        </Button>
      </div>

      <PageHeader
        title={order.subOrderNumber ?? order.orderNumber}
        description={`Placed ${formatDateTime(order.createdAt)}${
          order.parent?.orderNumber ? ` · part of ${order.parent.orderNumber}` : ""
        }`}
        actions={<StatusBadge status={order.status} />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel
            title="Items to fulfil"
            description={`${order.items.length} line${order.items.length === 1 ? "" : "s"} · ${pieces} pcs`}
            icon={Package}
            bodyClassName="p-0"
          >
            <ul className="divide-y">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/5">
                    {item.image ? (
                      <Image src={item.image} alt="" fill sizes="48px" className="object-cover" />
                    ) : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
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
                      {item.hsnCode ? ` · HSN ${item.hsnCode}` : ""} · GST {Number(item.gstRate)}%
                      {item.weightGrams > 0 ? ` · ${formatGrams(item.weightGrams)} each` : ""}
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums">{formatCurrency(item.lineTotal)}</p>
                </li>
              ))}
            </ul>

            <div className="grid gap-6 border-t bg-surface/70 px-5 py-4 md:grid-cols-2">
              <dl className="space-y-1 text-sm">
                <p className="eyebrow mb-2 text-muted-foreground">GST breakdown</p>
                <div className="flex justify-between text-muted-foreground">
                  <dt>Taxable value</dt>
                  <dd className="tabular-nums text-foreground">{formatCurrency(order.taxableAmount)}</dd>
                </div>
                {interState ? (
                  <div className="flex justify-between text-muted-foreground">
                    <dt>IGST</dt>
                    <dd className="tabular-nums text-foreground">{formatCurrency(order.igst)}</dd>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-muted-foreground">
                      <dt>CGST</dt>
                      <dd className="tabular-nums text-foreground">{formatCurrency(order.cgst)}</dd>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <dt>SGST</dt>
                      <dd className="tabular-nums text-foreground">{formatCurrency(order.sgst)}</dd>
                    </div>
                  </>
                )}
                <div className="flex justify-between border-t pt-1 text-muted-foreground">
                  <dt>Total tax (included)</dt>
                  <dd className="tabular-nums text-foreground">{formatCurrency(totalTax)}</dd>
                </div>
                <p className="pt-1 text-[11px] text-muted-foreground">
                  Place of supply:{" "}
                  {order.placeOfSupply
                    ? `${GST_STATE_CODES[order.placeOfSupply] ?? order.billingState} (${order.placeOfSupply})`
                    : order.billingState}
                  {" · "}
                  {interState ? "Inter-state → IGST" : "Intra-state → CGST + SGST"}
                </p>
              </dl>
              <dl className="space-y-1 text-sm md:justify-self-end md:min-w-60">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd className="tabular-nums">{formatCurrency(order.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Shipping</dt>
                  <dd className="tabular-nums">
                    {Number(order.shipping) === 0 ? "Free" : formatCurrency(order.shipping)}
                  </dd>
                </div>
                <div className="flex justify-between border-t pt-2 text-base font-bold">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatCurrency(order.total)}</dd>
                </div>
              </dl>
            </div>
          </Panel>

          <Panel
            title="Shipment & courier"
            description={
              order.shippedAt
                ? `Shipped ${formatDateTime(order.shippedAt)}${
                    order.deliveredAt ? ` · delivered ${formatDate(order.deliveredAt)}` : ""
                  }`
                : "Add courier details when you dispatch — the customer sees them on their order page."
            }
            icon={Truck}
          >
            <ShipmentForm
              orderId={order.id}
              status={order.status}
              action={vendorUpdateShipmentAction}
              formId={`vendor-shipment-${order.id}`}
              shipment={{
                courierName: order.courierName,
                trackingNumber: order.trackingNumber,
                trackingUrl: order.trackingUrl,
                expectedAt: order.expectedAt ? order.expectedAt.toISOString().slice(0, 10) : null,
                shipmentNote: order.shipmentNote,
              }}
            />
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Fulfilment" icon={PackageCheck} actions={<StatusBadge status={order.status} />}>
            <div className="space-y-3">
              {order.status === "PENDING" && (
                <ConfirmButton
                  label="Confirm order"
                  title="Confirm this order?"
                  description="Marks the order as confirmed so the customer knows it's being prepared."
                  confirmLabel="Confirm order"
                  variant="default"
                  destructive={false}
                  onConfirm={vendorConfirmSubOrderAction.bind(null, order.id)}
                />
              )}
              {(order.status === "SHIPPED" || order.status === "CONFIRMED") && (
                <ConfirmButton
                  label="Mark delivered"
                  title="Mark this order delivered?"
                  description="Only do this once the customer has received the package."
                  confirmLabel="Mark delivered"
                  variant="secondary"
                  destructive={false}
                  onConfirm={vendorDeliverSubOrderAction.bind(null, order.id)}
                />
              )}
              <p className="text-xs text-muted-foreground">
                Cancelling a sub-order is handled by the marketplace team. Reach out if something
                can&apos;t be fulfilled.
              </p>
            </div>
          </Panel>

          <Panel title="Customer" icon={User}>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-semibold">{order.customerName}</p>
                <p className="text-muted-foreground">{order.customerEmail}</p>
                <p className="text-muted-foreground">{order.customerPhone}</p>
              </div>
              {(order.companyName || order.gstNo) && (
                <div className="flex items-start gap-2.5">
                  <Building2 className="mt-0.5 size-4 text-primary" aria-hidden />
                  <div>
                    {order.companyName && <p className="font-semibold">{order.companyName}</p>}
                    {order.gstNo && (
                      <p className="text-muted-foreground">
                        GSTIN <span className="font-mono text-foreground">{order.gstNo}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Panel>

          <Panel title="Shipping address" icon={MapPin}>
            <p className="text-sm text-muted-foreground">
              {order.shippingAddress}, {order.shippingCity}, {order.shippingState} —{" "}
              {order.shippingPincode}
            </p>
          </Panel>

          {order.parent?.notes && (
            <Panel title="Order notes">
              <p className="whitespace-pre-line text-sm text-muted-foreground">{order.parent.notes}</p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
