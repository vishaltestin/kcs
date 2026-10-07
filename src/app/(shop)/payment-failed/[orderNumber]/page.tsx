import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Headset, Phone, ShieldCheck, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RetryPaymentButton } from "@/components/shop/retry-payment-button";
import { requireUser } from "@/lib/auth/guards";
import { getOrderByNumber } from "@/lib/queries/orders";
import { SITE } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Payment Incomplete",
};

const REASONS: Record<string, { title: string; body: string }> = {
  incomplete: {
    title: "Payment not completed",
    body: "Your payment wasn't completed, so this order isn't confirmed yet. No money was charged — try again when you're ready.",
  },
  verify: {
    title: "Couldn't verify your payment",
    body: "The gateway didn't respond in time. If money was debited, it will reflect on your order shortly — retrying is safe either way, since we always check the payment status first.",
  },
  confirm: {
    title: "Payment received — finishing up",
    body: "Your payment went through but finishing your order hit a snag. Please don't pay again — tap retry (it only confirms, never re-charges) or contact us with your order number.",
  },
  cancelled: {
    title: "This order was cancelled",
    body: "This order is no longer active. If money was debited, please contact us with your order number and we'll sort out the refund.",
  },
};

export default async function PaymentFailedPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ reason?: string }>;
}) {
  const { orderNumber } = await params;
  const { reason } = await searchParams;
  const user = await requireUser(`/payment-failed/${orderNumber}`);
  const order = await getOrderByNumber(orderNumber, user.id);
  if (!order) notFound();

  // A retry (or the webhook) may have confirmed the order already.
  if (order.paymentStatus === "PAID") redirect(`/order-success/${order.orderNumber}`);

  const copy = REASONS[reason ?? ""] ?? REASONS.incomplete;
  const cancelled = order.status === "CANCELLED";
  const pieces = order.displayItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="container max-w-2xl py-12 md:py-16">
      <div className="text-center">
        <span className="mx-auto mb-6 grid size-24 place-items-center">
          <span className="relative grid size-16 place-items-center rounded-full bg-destructive/[0.1] text-destructive">
            <XCircle className="size-8" strokeWidth={2.25} aria-hidden />
          </span>
        </span>
        <span className="kicker justify-center text-destructive">Order {order.orderNumber}</span>
        <h1 className="display mt-3 text-[2.25rem] md:text-[2.75rem]">{cancelled ? REASONS.cancelled.title : copy.title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{cancelled ? REASONS.cancelled.body : copy.body}</p>
      </div>

      {/* Order recap */}
      <div className="mt-10 rounded-xl bg-surface px-5 py-5 md:px-6">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[15px] font-semibold">
            {order.displayItems.length} {order.displayItems.length === 1 ? "item" : "items"} · {pieces} pcs
          </p>
          <p className="numeral text-[1.75rem] leading-none">{formatCurrency(order.total)}</p>
        </div>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {order.customerName} · {order.shippingCity}, {order.shippingState} — {order.shippingPincode}
        </p>
        <ul className="mt-4 space-y-2 border-t border-foreground/[0.08] pt-4 text-sm">
          {order.displayItems.slice(0, 5).map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate text-muted-foreground">
                {item.name}
                {item.variantLabel ? ` (${item.variantLabel})` : ""} × {item.quantity}
              </span>
              <span className="numeral shrink-0">{formatCurrency(item.lineTotal)}</span>
            </li>
          ))}
          {order.displayItems.length > 5 && (
            <li className="text-[13px] text-muted-foreground">
              + {order.displayItems.length - 5} more line{order.displayItems.length - 5 === 1 ? "" : "s"}
            </li>
          )}
        </ul>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        {!cancelled && <RetryPaymentButton orderNumber={order.orderNumber} total={Number(order.total)} />}
        <Button asChild variant={cancelled ? "default" : "outline"} size="lg">
          <Link href="/profile?tab=orders">
            <ArrowLeft aria-hidden /> My Orders
          </Link>
        </Button>
      </div>

      <ul className="mx-auto mt-8 max-w-md space-y-1.5 text-center text-xs text-muted-foreground">
        <li className="flex items-start justify-center gap-2">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
          Retrying is always safe — we verify with Cashfree first and never charge twice.
        </li>
      </ul>

      <div className="mt-8 flex flex-col items-center justify-between gap-4 border-y border-foreground/[0.12] py-5 sm:flex-row">
        <div className="flex items-center gap-3">
          <Headset className="size-5 text-primary" aria-hidden />
          <div className="text-sm">
            <p className="font-semibold">Charged but order not confirming?</p>
            <p className="text-muted-foreground">
              Call <a href={SITE.phoneHref} className="font-medium text-foreground hover:text-primary">{SITE.phone}</a> with your order number.
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
    </div>
  );
}
