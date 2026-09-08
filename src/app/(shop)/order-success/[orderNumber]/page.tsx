import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Headset,
  MapPin,
  Package,
  PackageCheck,
  Phone,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/guards";
import { getOrderByNumber } from "@/lib/queries/orders";
import { SITE } from "@/lib/constants";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

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
          <p className="eyebrow text-success">Order confirmed</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">Thank you, {order.customerName.split(" ")[0]}!</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Order <strong className="font-semibold text-foreground">{order.orderNumber}</strong> was placed on{" "}
            {formatDate(order.createdAt)}. Our gifting team will call or email you shortly to confirm
            branding and delivery details.
          </p>
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
                  <p className="truncate text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} × {formatCurrency(item.unitPrice)}
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
              {order.companyName && (
                <div className="flex items-start gap-2.5">
                  <Building2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Billed to</p>
                    <p className="mt-0.5 leading-snug">
                      {order.companyName}
                      {order.gstNo && <span className="text-muted-foreground"> · GST {order.gstNo}</span>}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <dl className="space-y-1.5 text-sm md:justify-self-end md:min-w-56">
              <div className="flex justify-between text-muted-foreground">
                <dt>Subtotal</dt>
                <dd className="font-medium text-foreground tabular-nums">{formatCurrency(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <dt>Shipping</dt>
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
