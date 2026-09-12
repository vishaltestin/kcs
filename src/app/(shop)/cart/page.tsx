"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Headset,
  Lock,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { useCartStore } from "@/store/cart";
import { useShippingEstimate } from "@/components/shop/use-shipping-estimate";
import { ShippingEstimateRow } from "@/components/shop/shipping-estimate-row";
import { SITE } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

export default function CartPage() {
  const { items, removeProduct, updateQuantity, reset } = useCartStore();
  const [destination, setDestination] = useState("");

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const { estimate, loading } = useShippingEstimate(items, destination, subtotal);
  const shipping = estimate?.amount ?? 0;
  const total = subtotal + shipping;
  const pieces = items.reduce((sum, item) => sum + item.qty, 0);
  const threshold = estimate?.freeShippingThreshold ?? 1000;
  const remaining = Math.max(0, threshold - subtotal);

  return (
    <div>
      <div className="container py-8 md:py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-foreground/[0.12] pb-6">
          <div>
            <span className="kicker text-primary">Step 1 of 3</span>
            <h1 className="display mt-1.5 text-[2.25rem] md:text-[2.9rem]">Your Cart</h1>
            {items.length > 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                {items.length} {items.length === 1 ? "product" : "products"} · {pieces} pieces
              </p>
            )}
          </div>
          <Link
            href="/product"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4" aria-hidden /> Continue shopping
          </Link>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Your cart is empty"
            description="Looks like you haven't added anything yet. Explore our corporate gifting catalogue."
            action={
              <Button asChild size="lg">
                <Link href="/product">
                  Start Shopping <ArrowRight aria-hidden />
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
            {/* Items */}
            <div className="min-w-0">
              <div>
                <div className="hidden grid-cols-[minmax(0,1fr)_9rem_7rem_2.5rem] items-center gap-4 border-b border-foreground/[0.12] pb-3 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase sm:grid">
                  <span>Product</span>
                  <span className="text-center">Quantity</span>
                  <span className="text-right">Total</span>
                  <span />
                </div>

                <ul className="divide-y divide-foreground/[0.08]">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="group/row grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_9rem_7rem_2.5rem] sm:items-center"
                    >
                      <div className="flex items-center gap-4">
                        <Link
                          href={`/product/${item.slug}`}
                          className="studio relative size-20 shrink-0 overflow-hidden rounded-lg sm:size-[5.5rem]"
                          aria-label={item.name}
                        >
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="88px"
                            className="object-contain p-1.5 mix-blend-multiply transition-transform duration-500 group-hover/row:scale-105 dark:mix-blend-normal"
                          />
                        </Link>
                        <div className="min-w-0">
                          <Link
                            href={`/product/${item.slug}`}
                            className="display line-clamp-2 text-[1.05rem] leading-snug transition-colors hover:text-primary"
                          >
                            {item.name}
                          </Link>
                          <p className="mt-1 text-sm text-muted-foreground">
                            <span className="numeral text-foreground">{formatCurrency(item.price)}</span> / pc
                            {item.variantLabel && <span className="text-foreground/80"> · {item.variantLabel}</span>}
                            {item.minQuantity > 1 && <span> · MOQ {item.minQuantity}</span>}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 sm:justify-center">
                        <div
                          className="flex h-10 items-center rounded-lg border bg-background"
                          aria-label={`Quantity for ${item.name}`}
                        >
                          <button
                            className="grid size-10 place-items-center rounded-l-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                            onClick={() => updateQuantity(item.id, item.qty - 1)}
                            disabled={item.qty <= item.minQuantity}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="size-4" aria-hidden />
                          </button>
                          <span className="min-w-10 text-center text-sm font-bold tabular-nums" aria-live="polite">
                            {item.qty}
                          </span>
                          <button
                            className="grid size-10 place-items-center rounded-r-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            onClick={() => updateQuantity(item.id, item.qty + 1)}
                            aria-label="Increase quantity"
                          >
                            <Plus className="size-4" aria-hidden />
                          </button>
                        </div>
                        <p className="numeral text-[1.1rem] sm:hidden">{formatCurrency(item.price * item.qty)}</p>
                      </div>

                      <p className="numeral hidden text-right text-[1.1rem] sm:block">{formatCurrency(item.price * item.qty)}</p>

                      <button
                        onClick={() => removeProduct(item.id)}
                        className="hidden size-9 place-items-center justify-self-end rounded-lg text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive sm:grid"
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                      <button
                        onClick={() => removeProduct(item.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive sm:hidden"
                      >
                        <Trash2 className="size-3.5" aria-hidden /> Remove
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between border-t border-foreground/[0.12] py-3">
                  <button
                    onClick={reset}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" aria-hidden /> Clear cart
                  </button>
                  <p className="text-xs text-muted-foreground">Prices are re-verified at checkout.</p>
                </div>
              </div>

              {/* Reassurance strip */}
              <ol className="mt-8 grid gap-x-8 gap-y-4 sm:grid-cols-3">
                {[
                  { icon: BadgeCheck, title: "Bulk pricing", text: "Tiered discounts auto-apply on quantity." },
                  { icon: Truck, title: "Pan-India delivery", text: "Doorstep or desk-drop to 19,000+ PIN codes." },
                  { icon: Headset, title: "Human confirmation", text: "A gifting manager verifies every order." },
                ].map((f, index) => (
                  <li key={f.title} className="flex gap-3">
                    <span className="numeral pt-0.5 text-[12px] text-primary">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <p className="flex items-center gap-1.5 text-[13.5px] font-semibold">
                        <f.icon className="size-3.5 text-foreground/60" aria-hidden /> {f.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{f.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Summary */}
            <aside className="lg:sticky lg:top-20">
              <div className="overflow-hidden rounded-xl bg-surface">
                <div className="border-b border-foreground/[0.08] px-5 py-4">
                  <h2 className="display text-[1.25rem]">Order summary</h2>
                </div>

                <div className="space-y-4 px-5 py-5">
                  {remaining > 0 && (
                    <p className="flex items-center gap-2 rounded-lg bg-background px-3 py-2 text-xs text-muted-foreground">
                      <Truck className="size-4 shrink-0 text-primary" aria-hidden />
                      <span>
                        Add <strong className="text-foreground">{formatCurrency(remaining)}</strong> more for free shipping
                      </span>
                    </p>
                  )}

                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <dt>Subtotal</dt>
                      <dd className="font-medium text-foreground tabular-nums">{formatCurrency(subtotal)}</dd>
                    </div>
                    <ShippingEstimateRow
                      estimate={estimate}
                      loading={loading}
                      destination={destination}
                      onDestinationChange={setDestination}
                    />
                    <div className="flex items-baseline justify-between border-t border-foreground/[0.12] pt-3">
                      <dt className="text-[15px] font-semibold">{destination.trim() ? "Total" : "Estimated total"}</dt>
                      <dd className="numeral text-[1.75rem] leading-none">{formatCurrency(total)}</dd>
                    </div>
                  </dl>
                  <p className="text-[11px] text-muted-foreground">Inclusive of all taxes · GST invoice with every order</p>

                  <Button asChild className="w-full" size="xl">
                    <Link href="/checkout">
                      <Lock aria-hidden /> Proceed to Checkout <ArrowRight aria-hidden />
                    </Link>
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    Need a formal quotation?{" "}
                    <Link href="/contact-us" className="font-semibold text-primary hover:underline">
                      Request one
                    </Link>{" "}
                    or call{" "}
                    <a href={SITE.phoneHref} className="font-semibold text-foreground hover:text-primary">
                      {SITE.phone}
                    </a>
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
