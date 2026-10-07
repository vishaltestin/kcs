import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Headset,
  MapPin,
  Package,
  PackageCheck,
  Phone,
  Receipt,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/guards";
import { getOrderByNumber } from "@/lib/queries/orders";
import { SITE } from "@/lib/constants";
import { formatGrams } from "@/lib/shipping";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { CopyButton } from "@/components/shared/copy-button";
import { ClearCartOnSuccess } from "@/components/shop/clear-cart-on-success";

export const metadata: Metadata = {
  title: "Order Confirmed",
};

const TIMELINE = [
  { key: "PENDING", label: "Order placed", icon: ClipboardCheck },
  { key: "CONFIRMED", label: "Confirmed", icon: PackageCheck },
  { key: "SHIPPED", label: "Shipped", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
] as const;

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const user = await requireUser(`/order-success/${orderNumber}`);
  const order = await getOrderByNumber(orderNumber, user.id);
  if (!order) notFound();

  const stageIndex = Math.max(
    0,
    TIMELINE.findIndex((s) => s.key === order.status)
  );
  const cancelled = order.status === "CANCELLED";
  const pieces = order.displayItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalTax = Number(order.cgst) + Number(order.sgst) + Number(order.igst);
  const interState = Number(order.igst) > 0;
  const shipped = order.status === "SHIPPED" || order.status === "DELIVERED";
  const hasShipment = !!(order.courierName || order.trackingNumber);
  const isFresh = order.status === "PENDING";

  return (
    <div className="relative overflow-hidden">
      <div className="container relative max-w-3xl py-12 md:py-16">
        <ClearCartOnSuccess orderNumber={order.orderNumber} />
        {/* Hero */}
        <div className="mb-10 text-center">
          <span className="relative mx-auto mb-6 grid size-24 place-items-center">
            <span aria-hidden className="animate-ring absolute inset-0 rounded-full border border-success/40" />
            <span className="relative grid size-16 place-items-center rounded-full bg-success text-white">
              <CheckCircle2 className="size-8" strokeWidth={2.25} aria-hidden />
            </span>
          </span>
          <span className="kicker text-success">
            {cancelled ? "Order cancelled" : order.status === "DELIVERED" ? "Delivered" : shipped ? "On its way" : "Order confirmed"}
          </span>
          <h1 className="display mt-3 text-[2.25rem] md:text-[2.9rem]">
            {isFresh ? `Thank you, ${order.customerName.split(" ")[0]}!` : `Order ${order.orderNumber}`}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            {isFresh ? (
              <>
                Order <strong className="font-semibold text-foreground">{order.orderNumber}</strong> was placed on{" "}
                {formatDate(order.createdAt)}. Our gifting team will call or email you shortly to confirm branding and
                delivery details.
              </>
            ) : (
              <>
                Placed on {formatDate(order.createdAt)}
                {order.shippedAt ? ` · shipped ${formatDate(order.shippedAt)}` : ""}
                {order.deliveredAt ? ` · delivered ${formatDate(order.deliveredAt)}` : ""}.
              </>
            )}
          </p>

          {!cancelled && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <Button asChild variant="outline" size="sm">
                <a href={`/api/orders/${order.orderNumber}/invoice`} target="_blank" rel="noopener noreferrer">
                  <FileText aria-hidden /> View {order.gstNo ? "tax invoice" : "invoice"}
                </a>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <a href={`/api/orders/${order.orderNumber}/invoice?download=1`}>
                  <Receipt aria-hidden /> Download PDF
                </a>
              </Button>
              {order.invoiceNumber && (
                <span className="font-mono text-[11px] font-semibold text-muted-foreground">{order.invoiceNumber}</span>
              )}
            </div>
          )}
        </div>

        {/* Payment status — online-only checkout confirms the order on payment */}
        {order.paymentStatus === "PAID" ? (
          <div className="mb-10 flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 rounded-xl bg-success/[0.08] px-5 py-3.5 text-sm">
            <CheckCircle2 className="size-4 text-success" aria-hidden />
            <span className="font-semibold">Paid online</span>
            {order.paidAt && (
              <span className="text-muted-foreground">on {formatDate(order.paidAt)}</span>
            )}
            {order.cfPaymentId && (
              <>
                <span className="font-mono text-[12px] font-bold">{order.cfPaymentId}</span>
                <CopyButton value={order.cfPaymentId} />
              </>
            )}
          </div>
        ) : (
          !cancelled && (
            <div className="mb-10 rounded-xl border border-warning/40 bg-warning/[0.08] px-5 py-4 text-center">
              <p className="text-[15px] font-bold">
                Payment {order.paymentStatus === "FAILED" ? "failed" : "pending"} — this order
                isn&apos;t confirmed yet.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Stock is reserved only after payment. Complete it now to confirm your order.
              </p>
              <Button asChild size="sm" className="mt-3">
                <Link href={`/payment-failed/${order.orderNumber}`}>
                  Complete payment <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          )
        )}

        {/* Status timeline */}
        <div className="mb-10 border-y border-foreground/[0.12] py-6">
          {cancelled ? (
            <p className="text-center text-sm font-semibold text-destructive">This order has been cancelled.</p>
          ) : (
            <ol className="grid grid-cols-4 gap-2">
              {TIMELINE.map((stage, i) => {
                const done = i <= stageIndex;
                const Icon = stage.icon;
                return (
                  <li key={stage.key} className="relative flex flex-col items-center text-center">
                    {i > 0 && (
                      <span
                        aria-hidden
                        className={cn(
                          "absolute top-5 right-1/2 left-[-50%] h-px",
                          i <= stageIndex ? "bg-success" : "bg-foreground/15"
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        "relative z-10 grid size-10 place-items-center rounded-full ring-4 ring-background",
                        done ? "bg-success text-white" : "bg-surface text-muted-foreground"
                      )}
                    >
                      <Icon className="size-4.5" aria-hidden />
                    </span>
                    <span className={cn("mt-2 text-[11px] font-semibold sm:text-xs", done ? "text-foreground" : "text-muted-foreground")}>
                      {stage.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Shipment tracking */}
        {!cancelled && order.isSplit && (
          <div className="mb-10 grid gap-3">
            <h2 className="display text-[1.25rem]">Fulfilment by seller</h2>
            <p className="-mt-2 mb-1 text-sm text-muted-foreground">
              Your order is fulfilled by {order.shipments.length} sellers — track each package separately.
            </p>
            {order.shipments.map((shipment) => {
              const shipped = shipment.status === "SHIPPED" || shipment.status === "DELIVERED";
              const STATUS_LABEL: Record<string, string> = {
                PENDING: "Awaiting confirmation",
                CONFIRMED: "Confirmed — packing",
                SHIPPED: "Shipped",
                DELIVERED: "Delivered",
                CANCELLED: "Cancelled",
              };
              return (
                <div key={shipment.id} className="rounded-xl bg-surface p-4 md:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Package className="size-4.5 shrink-0 text-primary" aria-hidden />
                      <p className="text-[15px] font-bold">{shipment.vendorName}</p>
                      <span className="font-mono text-[11px] font-semibold text-muted-foreground">
                        {shipment.subOrderNumber}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
                        shipment.status === "DELIVERED"
                          ? "bg-success/15 text-success"
                          : shipped
                            ? "bg-primary/10 text-primary"
                            : "bg-foreground/[0.06] text-muted-foreground",
                      )}
                    >
                      {STATUS_LABEL[shipment.status] ?? shipment.status}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {shipment.itemCount} {shipment.itemCount === 1 ? "pc" : "pcs"} · {formatCurrency(shipment.total)}
                    {shipment.shippedAt ? ` · shipped ${formatDate(shipment.shippedAt)}` : ""}
                    {shipment.deliveredAt ? ` · delivered ${formatDate(shipment.deliveredAt)}` : ""}
                    {!shipped && shipment.status !== "DELIVERED" && shipment.expectedAt
                      ? ` · expected ${formatDate(shipment.expectedAt)}`
                      : ""}
                  </p>
                  {shipment.trackingNumber && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-xs text-muted-foreground">{shipment.courierName ?? "Courier"}</span>
                      <span className="font-mono text-[13px] font-bold tracking-wide">{shipment.trackingNumber}</span>
                      <CopyButton value={shipment.trackingNumber} />
                      {shipment.trackingUrl && (
                        <a
                          href={shipment.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          Track <ExternalLink className="size-3" aria-hidden />
                        </a>
                      )}
                    </div>
                  )}
                  {shipment.shipmentNote && (
                    <p className="mt-2 text-xs text-muted-foreground">{shipment.shipmentNote}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!cancelled && !order.isSplit && (
          <div
            className={cn(
              "mb-10 overflow-hidden",
              hasShipment ? "rounded-xl bg-brand-ink text-white" : "border-l-2 border-primary",
            )}
          >
            {hasShipment ? (
              <div className="relative p-5 md:p-6">
                <span aria-hidden className="absolute -top-20 -right-20 size-56 rounded-full bg-primary/25 blur-3xl" />
                <div className="relative grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div>
                    <span className="kicker text-brand-teal-light">{order.status === "DELIVERED" ? "Delivered" : "Shipped via"}</span>
                    <h2 className="display mt-1.5 text-[1.6rem] text-white">{order.courierName ?? "Courier"}</h2>
                    <dl className="mt-3 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                      {order.trackingNumber && (
                        <div>
                          <dt className="text-xs text-white/60">Tracking / AWB number</dt>
                          <dd className="mt-0.5 flex items-center gap-2 font-mono text-[15px] font-bold tracking-wide">
                            {order.trackingNumber}
                            <CopyButton value={order.trackingNumber} className="text-white/70 hover:text-white" />
                          </dd>
                        </div>
                      )}
                      {order.shippedAt && (
                        <div>
                          <dt className="text-xs text-white/60">Dispatched on</dt>
                          <dd className="mt-0.5 font-semibold">{formatDate(order.shippedAt)}</dd>
                        </div>
                      )}
                      {order.expectedAt && order.status !== "DELIVERED" && (
                        <div>
                          <dt className="text-xs text-white/60">Expected delivery</dt>
                          <dd className="mt-0.5 flex items-center gap-1.5 font-semibold">
                            <CalendarClock className="size-4 text-brand-teal-light" aria-hidden /> {formatDate(order.expectedAt)}
                          </dd>
                        </div>
                      )}
                      {order.deliveredAt && (
                        <div>
                          <dt className="text-xs text-white/60">Delivered on</dt>
                          <dd className="mt-0.5 font-semibold">{formatDate(order.deliveredAt)}</dd>
                        </div>
                      )}
                      {order.shippingZone && (
                        <div>
                          <dt className="text-xs text-white/60">Service</dt>
                          <dd className="mt-0.5 font-semibold">
                            {order.shippingZone}
                            {order.chargeableWeight > 0 ? ` · ${formatGrams(order.chargeableWeight)}` : ""}
                          </dd>
                        </div>
                      )}
                    </dl>
                    {order.shipmentNote && <p className="mt-3 text-sm text-white/75">{order.shipmentNote}</p>}
                  </div>
                  {order.trackingUrl && (
                    <Button asChild size="lg" className="md:self-center">
                      <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink aria-hidden /> Track shipment
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 py-1 pl-4 text-sm">
                <Truck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="font-semibold">Courier details will appear here</p>
                  <p className="text-muted-foreground">
                    As soon as your order is dispatched we add the courier name, tracking number and expected delivery date.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        <div>
          <div className="flex items-end justify-between border-b border-foreground/[0.12] pb-3">
            <h2 className="display text-[1.5rem]">Order summary</h2>
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {order.displayItems.length} {order.displayItems.length === 1 ? "item" : "items"} · {pieces} pcs
            </span>
          </div>

          <ul className="divide-y divide-foreground/[0.08]">
            {order.displayItems.map((item) => (
              <li key={item.id} className="flex items-center gap-4 py-4">
                <span className="studio relative size-14 shrink-0 overflow-hidden rounded-lg">
                  {item.image ? (
                    <Image src={item.image} alt="" fill sizes="56px" className="object-contain p-1 mix-blend-multiply dark:mix-blend-normal" />
                  ) : (
                    <span className="grid size-full place-items-center text-muted-foreground">
                      <Package className="size-5" aria-hidden />
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold">
                    {item.name}
                    {item.variantLabel && <span className="ml-2 text-[13px] font-medium text-muted-foreground">{item.variantLabel}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} × {formatCurrency(item.unitPrice)}
                    {item.sku ? ` · SKU ${item.sku}` : ""}
                  </p>
                </div>
                <p className="numeral text-[15px]">{formatCurrency(item.lineTotal)}</p>
              </li>
            ))}
          </ul>

          <div className="grid gap-6 rounded-xl bg-surface px-5 py-5 md:grid-cols-2 md:px-6">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Shipping to</p>
                  <p className="mt-0.5 leading-snug">
                    {order.shippingAddress}, {order.shippingCity}, {order.shippingState} — {order.shippingPincode}
                  </p>
                </div>
              </div>
              {(order.companyName || order.gstNo) && (
                <div className="flex items-start gap-2.5">
                  <Building2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Billed to</p>
                    <p className="mt-0.5 leading-snug">
                      {order.companyName ?? order.customerName}
                      {order.gstNo && <span className="text-muted-foreground"> · GSTIN {order.gstNo}</span>}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2.5">
                <Receipt className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">GST included</p>
                  <p className="mt-0.5 leading-snug text-muted-foreground">
                    Taxable {formatCurrency(order.taxableAmount)} ·{" "}
                    {interState
                      ? `IGST ${formatCurrency(order.igst)}`
                      : `CGST ${formatCurrency(order.cgst)} + SGST ${formatCurrency(order.sgst)}`}
                    {" "}= {formatCurrency(totalTax)}
                  </p>
                </div>
              </div>
            </div>

            <dl className="space-y-1.5 text-sm md:justify-self-end md:min-w-56">
              <div className="flex justify-between text-muted-foreground">
                <dt>Subtotal</dt>
                <dd className="font-medium text-foreground tabular-nums">{formatCurrency(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <dt>
                  Shipping
                  {order.shippingZone && <span className="block text-[11px]">{order.shippingZone}{order.chargeableWeight > 0 ? ` · ${formatGrams(order.chargeableWeight)}` : ""}</span>}
                </dt>
                <dd className={cn("font-medium tabular-nums", Number(order.shipping) === 0 ? "text-success" : "text-foreground")}>
                  {Number(order.shipping) === 0 ? "Free" : formatCurrency(order.shipping)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-foreground/[0.12] pt-2">
                <dt className="text-[15px] font-semibold">Total</dt>
                <dd className="numeral text-[1.5rem] leading-none">{formatCurrency(order.total)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Help + actions */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-y border-foreground/[0.12] py-5 sm:flex-row">
          <div className="flex items-center gap-3">
            <Headset className="size-5 text-primary" aria-hidden />
            <div className="text-sm">
              <p className="font-semibold">Need to change something?</p>
              <p className="text-muted-foreground">
                Call <a href={SITE.phoneHref} className="font-medium text-foreground hover:text-primary">{SITE.phone}</a> and quote your order number.
              </p>
            </div>
          </div>
          <a
            href={SITE.phoneHref}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <Phone className="size-4" aria-hidden /> Call now
          </a>
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="outline" size="lg">
            <Link href="/product">Continue Shopping</Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/profile?tab=orders">
              View My Orders <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
