import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  FileText,
  MapPin,
  Package,
  Receipt,
  Scale,
  Truck,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { ActionSelect } from "@/components/admin/action-select";
import { ShipmentForm } from "@/components/admin/orders/shipment-form";
import { getAdminOrderById } from "@/lib/queries/admin";
import { updateOrderStatusAction } from "@/actions/admin/engagements";
import { ORDER_STATUSES } from "@/lib/constants";
import { GST_STATE_CODES } from "@/lib/tax";
import { formatGrams } from "@/lib/shipping";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Order Details" };

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getAdminOrderById(id);
  if (!order) notFound();

  const totalTax = Number(order.cgst) + Number(order.sgst) + Number(order.igst);
  const interState = Number(order.igst) > 0;
  const pieces = order.items.reduce((s, i) => s + i.quantity, 0);
  const canInvoice = order.status !== "CANCELLED";

  return (
    <div>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/orders">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden /> All orders
          </Link>
        </Button>
      </div>

      <PageHeader
        title={order.orderNumber}
        description={`Placed ${formatDateTime(order.createdAt)} · ${order.user?.email ?? order.customerEmail}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canInvoice && (
              <Button asChild variant="outline" size="sm">
                <a href={`/api/orders/${order.orderNumber}/invoice`} target="_blank" rel="noopener noreferrer">
                  <FileText aria-hidden /> {order.gstNo ? "Tax invoice" : "Invoice"} PDF
                </a>
              </Button>
            )}
            <ActionSelect
              value={order.status}
              options={ORDER_STATUSES}
              on_change={updateOrderStatusAction.bind(null, order.id)}
              ariaLabel="Order status"
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel
            title="Items"
            description={`${order.items.length} line${order.items.length === 1 ? "" : "s"} · ${pieces} pcs`}
            icon={Package}
            bodyClassName="p-0"
          >
            <ul className="divide-y">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/5">
                    {item.image ? <Image src={item.image} alt="" fill sizes="48px" className="object-cover" /> : null}
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
                  Place of supply: {order.placeOfSupply ? `${GST_STATE_CODES[order.placeOfSupply] ?? order.billingState} (${order.placeOfSupply})` : order.billingState}
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
                  <dd className="tabular-nums">{Number(order.shipping) === 0 ? "Free" : formatCurrency(order.shipping)}</dd>
                </div>
                <div className="flex justify-between border-t pt-2 text-base font-bold">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatCurrency(order.total)}</dd>
                </div>
                {(order.shippingZone || order.chargeableWeight > 0) && (
                  <p className="flex items-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
                    <Scale className="size-3.5" aria-hidden />
                    {order.shippingZone ?? "—"}
                    {order.chargeableWeight > 0 ? ` · ${formatGrams(order.chargeableWeight)} chargeable` : ""}
                  </p>
                )}
              </dl>
            </div>
          </Panel>

          <Panel
            title="Shipment & courier"
            description={
              order.shippedAt
                ? `Shipped ${formatDateTime(order.shippedAt)}${order.deliveredAt ? ` · delivered ${formatDate(order.deliveredAt)}` : ""}`
                : "Enter courier details when the order is dispatched — the customer sees them on their order page."
            }
            icon={Truck}
            actions={
              order.trackingUrl ? (
                <Button asChild variant="outline" size="sm">
                  <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink aria-hidden /> Track
                  </a>
                </Button>
              ) : null
            }
          >
            <ShipmentForm
              orderId={order.id}
              status={order.status}
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
          <Panel title="Status" icon={Receipt} actions={<StatusBadge status={order.status} />}>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <User className="mt-0.5 size-4 text-primary" aria-hidden />
                <div>
                  <p className="font-semibold">{order.customerName}</p>
                  <p className="text-muted-foreground">{order.customerEmail}</p>
                  <p className="text-muted-foreground">{order.customerPhone}</p>
                </div>
              </div>
              {(order.companyName || order.gstNo) && (
                <div className="flex items-start gap-2.5">
                  <Building2 className="mt-0.5 size-4 text-primary" aria-hidden />
                  <div>
                    {order.companyName && <p className="font-semibold">{order.companyName}</p>}
                    <p className="text-muted-foreground">
                      {order.gstNo ? (
                        <>
                          GSTIN <span className="font-mono text-foreground">{order.gstNo}</span>
                        </>
                      ) : (
                        "No GSTIN — B2C invoice"
                      )}
                    </p>
                  </div>
                </div>
              )}
              <div className="rounded-xl bg-surface p-3 text-xs">
                <p className="flex items-center justify-between">
                  <span className="text-muted-foreground">Invoice</span>
                  <span className="font-mono font-semibold">{order.invoiceNumber ?? "Issued on download"}</span>
                </p>
                {order.invoicedAt && (
                  <p className="mt-1 flex items-center justify-between">
                    <span className="text-muted-foreground">Issued</span>
                    <span>{formatDate(order.invoicedAt)}</span>
                  </p>
                )}
                <p className="mt-1 flex items-center justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span>{order.gstNo ? "B2B tax invoice" : "B2C invoice"}</span>
                </p>
              </div>
            </div>
          </Panel>

          <Panel title="Addresses" icon={MapPin}>
            <div className="space-y-4 text-sm">
              <div>
                <p className="mb-1 font-semibold">Billing</p>
                <p className="text-muted-foreground">
                  {order.billingAddress}, {order.billingCity}, {order.billingState} — {order.billingPincode}
                </p>
              </div>
              <div>
                <p className="mb-1 font-semibold">Shipping</p>
                <p className="text-muted-foreground">
                  {order.shippingAddress}, {order.shippingCity}, {order.shippingState} — {order.shippingPincode}
                </p>
              </div>
            </div>
          </Panel>

          {order.notes && (
            <Panel title="Order notes">
              <p className="text-sm whitespace-pre-line text-muted-foreground">{order.notes}</p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
