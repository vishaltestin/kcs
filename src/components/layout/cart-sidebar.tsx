"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShieldCheck, ShoppingCart, Trash2, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useCartStore } from "@/store/cart";
import { formatCurrency } from "@/lib/utils";

const FREE_SHIPPING_THRESHOLD = 1000;

export function CartSidebar() {
  const { items, removeProduct, updateQuantity, reset } = useCartStore();
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : 100;
  const total = subtotal + shipping;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label={`Open cart, ${items.length} items`}>
          <ShoppingCart className="h-4 w-4" aria-hidden />
          {items.length > 0 && (
            <span
              className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground shadow-sm"
              aria-hidden
            >
              {items.length}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-md">
        {/* Header */}
        <SheetHeader className="flex-shrink-0 border-b px-6 py-5">
          <SheetTitle className="flex items-center justify-between text-lg font-bold">
            <span className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <ShoppingCart className="size-4.5" aria-hidden />
              </span>
              Your Cart
              {items.length > 0 && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </span>
              )}
            </span>
            {items.length > 0 && (
              <button
                onClick={reset}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
                aria-label="Clear cart"
              >
                <Trash2 className="size-3.5" aria-hidden /> Clear
              </button>
            )}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Review the items in your cart before checking out.
          </SheetDescription>
        </SheetHeader>

        {/* Items */}
        <div className="flex-grow overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="mb-5 grid size-20 place-items-center rounded-full bg-muted">
                <ShoppingCart className="size-9 text-muted-foreground/50" aria-hidden />
              </span>
              <p className="mb-1 text-base font-semibold">Your cart is empty</p>
              <p className="mb-7 max-w-64 text-sm text-muted-foreground">
                Browse our catalogue to find the perfect corporate gift.
              </p>
              <SheetClose asChild>
                <Button size="lg" asChild>
                  <Link href="/product">
                    Start Shopping <ArrowRight className="ml-1 size-4" aria-hidden />
                  </Link>
                </Button>
              </SheetClose>
            </div>
          ) : (
            <ul className="flex flex-col gap-5">
              {items.map((product) => (
                <li key={product.id} className="group/item flex gap-4">
                  <SheetClose asChild>
                    <Link
                      href={`/product/${product.slug}`}
                      className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/5"
                      aria-label={product.name}
                    >
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="80px"
                        className="object-cover transition-transform duration-300 group-hover/item:scale-105"
                      />
                    </Link>
                  </SheetClose>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <SheetClose asChild>
                      <Link
                        href={`/product/${product.slug}`}
                        className="line-clamp-2 text-sm font-medium leading-snug transition-colors hover:text-primary"
                      >
                        {product.name}
                      </Link>
                    </SheetClose>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatCurrency(product.price)} / pc
                    </p>

                    <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                      <div className="flex items-center rounded-lg border">
                        <button
                          className="grid size-8 place-items-center rounded-l-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                          onClick={() => updateQuantity(product.id, product.qty - 1)}
                          disabled={product.qty <= product.minQuantity}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-3.5" aria-hidden />
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
                          {product.qty}
                        </span>
                        <button
                          className="grid size-8 place-items-center rounded-r-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          onClick={() => updateQuantity(product.id, product.qty + 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-3.5" aria-hidden />
                        </button>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <p className="text-sm font-bold tabular-nums">
                          {formatCurrency(product.price * product.qty)}
                        </p>
                        <button
                          onClick={() => removeProduct(product.id)}
                          className="grid size-8 place-items-center rounded-lg text-muted-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Remove ${product.name} from cart`}
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="flex-shrink-0 space-y-4 border-t bg-muted/40 px-6 py-5">
            {/* Free shipping progress */}
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-medium">
                <Truck className="size-4 text-primary" aria-hidden />
                {remaining > 0 ? (
                  <span>
                    Add <strong className="text-foreground">{formatCurrency(remaining)}</strong> more for free shipping
                  </span>
                ) : (
                  <span className="text-primary">You&apos;ve unlocked free shipping 🎉</span>
                )}
              </div>
              <div
                className="h-1.5 overflow-hidden rounded-full bg-muted-foreground/15"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
              >
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-medium text-foreground tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span className={`font-medium tabular-nums ${shipping === 0 ? "text-primary" : "text-foreground"}`}>
                  {shipping === 0 ? "Free" : formatCurrency(shipping)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="grid gap-2.5">
              <SheetClose asChild>
                <Button size="lg" asChild className="w-full">
                  <Link href="/checkout">
                    Proceed to Checkout <ArrowRight className="ml-1 size-4" aria-hidden />
                  </Link>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button variant="ghost" asChild className="w-full">
                  <Link href="/cart">View Full Cart</Link>
                </Button>
              </SheetClose>
            </div>

            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" aria-hidden /> Secure checkout · GST invoice on request
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
