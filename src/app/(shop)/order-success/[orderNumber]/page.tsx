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
  const pieces = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalTax = Number(order.cgst) + Number(order.sgst) + Number(order.igst);
  const interState = Number(order.igst) > 0;
  const shipped = order.status === "SHIPPED" || order.status === "DELIVERED";
  const hasShipment = !!(order.courierName || order.trackingNumber);
  const isFresh = order.status === "PENDING";

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-gradient-to-b from-success/[0.07] to-transparent" />
      <div className="container relative mx-auto max-w-3xl px-4 py-12 md:py-16">
        {/* Hero */}
        <div className="mb-10 text-center">
          <span className="relative mx-auto mb-6 grid size-24 place-items-center">
            <span aria-hidden className="animate-ring absolute inset-0 rounded-full border-2 border-success/40" />
            <span aria-hidden className="absolute inset-2 rounded-full bg-success/10" />
            <span className="relative grid size-16 place-items-center rounded-full bg-success text-white shadow-[0_14px_30px_-10px_rgb(22_163_74/0.6)]">
              <CheckCircle2 className="size-8" strokeWidth={2.25} aria-hidden />
            </span>
          </span>
          <p className="eyebrow text-success">
            {cancelled ? "Order cancelled" : order.status === "DELIVERED" ? "Delivered" : shipped ? "On its way" : "Order confirmed"}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
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
                <span className="rounded-full bg-muted px-2.5 py-1 font-mono text-[11px] font-semibold text-muted-foreground">
                  {order.invoiceNumber}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Status timeline */}
        <div className="mb-6 rounded-2xl bg-card p-5 ring-1 ring-foreground/[0.07] md:p-6">
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
                          "absolute top-5 right-1/2 left-[-50%] h-0.5",
                          i <= stageIndex ? "bg-success" : "bg-border"
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        "relative z-10 grid size-10 place-items-center rounded-full ring-4 ring-card",
                        done ? "bg-success text-white" : "bg-muted text-muted-foreground"
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
        {!cancelled && (
          <div
            className={cn(
              "mb-6 overflow-hidden rounded-2xl ring-1",
              hasShipment ? "bg-brand-charcoal text-white ring-white/10" : "bg-card ring-foreground/[0.07]",
            )}
          >
            {hasShipment ? (
              <div className="relative p-5 md:p-6">
                <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-30" />
                <div className="relative grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div>
                    <p className="eyebrow text-brand-amber">{order.status === "DELIVERED" ? "Delivered" : "Shipped via"}</p>
                    <h2 className="mt-1 text-xl font-extrabold tracking-tight">{order.courierName ?? "Courier"}</h2>
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
                            <CalendarClock className="size-4 text-brand-amber" aria-hidden /> {formatDate(order.expectedAt)}
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
              <div className="flex items-center gap-3 px-5 py-4 text-sm md:px-6">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/[0.08] text-primary">
                  <Truck className="size-4.5" aria-hidden />
                </span>
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
        <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/[0.07]">
          <div className="flex items-center justify-between border-b px-5 py-4 md:px-6">
            <h2 className="flex items-center gap-2 text-base font-extrabold tracking-tight">
              <Package className="size-4.5 text-primary" aria-hidden /> Order Summary
            </h2>
            <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
              {order.items.length} {order.items.length === 1 ? "item" : "items"} · {pieces} pcs
            </span>
          </div>

          <ul className="divide-y px-5 md:px-6">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 py-4">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/5">
                  {item.image ? (
                    <Image src={item.image} alt="" fill sizes="56px" className="object-cover" />
                  ) : (
                    <span className="grid size-full place-items-center text-muted-foreground">
                      <Package className="size-5" aria-hidden />
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
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
                <p className="text-sm font-bold tabular-nums">{formatCurrency(item.lineTotal)}</p>
              </li>
            ))}
          </ul>

          <div className="grid gap-6 border-t bg-surface px-5 py-5 md:grid-cols-2 md:px-6">
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
              <div className="flex justify-between border-t pt-2 text-base font-extrabold tracking-tight">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatCurrency(order.total)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Help + actions */}
        <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-dashed p-5 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-primary/[0.08] text-primary">
              <Headset className="size-4.5" aria-hidden />
            </span>
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
