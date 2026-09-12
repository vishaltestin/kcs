"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

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


export function CartSidebar({ compact = false }: { compact?: boolean }) {
  const { items, removeProduct, updateQuantity, reset } = useCartStore();
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const pieces = items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <Sheet>
      <SheetTrigger asChild>
        {compact ? (
          <button
            type="button"
            className="relative grid size-10 place-items-center rounded-full border border-border bg-background text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            aria-label={`Open cart, ${items.length} items`}
          >
            <ShoppingBag className="size-[18px]" aria-hidden />
            {items.length > 0 && (
              <span
                className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground shadow-sm ring-2 ring-background"
                aria-hidden
              >
                {items.length}
              </span>
            )}
          </button>
        ) : (
          <button
            type="button"
            className="group/cart flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-muted"
            aria-label={`Open cart, ${items.length} items`}
          >
            <span className="relative grid size-10 place-items-center rounded-full bg-foreground text-background transition-colors group-hover/cart:bg-primary">
              <ShoppingBag className="size-[18px]" aria-hidden />
              {items.length > 0 && (
                <span
                  className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground ring-2 ring-background"
                  aria-hidden
                >
                  {items.length}
                </span>
              )}
            </span>
            <span className="flex flex-col text-left leading-tight">
              <small className="text-[11px] font-medium text-muted-foreground">Your cart</small>
              <span className="text-[14px] font-bold tracking-tight tabular-nums">{formatCurrency(subtotal)}</span>
            </span>
          </button>
        )}
      </SheetTrigger>

      <SheetContent className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-md">
        {/* Header */}
        <SheetHeader className="flex-shrink-0 border-b px-6 py-4">
          <SheetTitle className="flex items-baseline justify-between pr-8">
            <span className="display text-[1.35rem]">
              Your Cart
              {items.length > 0 && (
                <span className="ml-2 font-sans text-[13px] font-medium tracking-normal text-muted-foreground">
                  {items.length} {items.length === 1 ? "item" : "items"} · {pieces} pcs
                </span>
              )}
            </span>
            {items.length > 0 && (
              <button
                onClick={reset}
                className="text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-destructive hover:underline"
                aria-label="Clear cart"
              >
                Clear
              </button>
            )}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Review the items in your cart before checking out.
          </SheetDescription>
        </SheetHeader>

        {/* Items */}
        <div className="scrollbar-thin flex-grow overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="mb-6 grid size-16 place-items-center rounded-full border border-primary/30 text-primary">
                <ShoppingBag className="size-7" strokeWidth={1.6} aria-hidden />
              </span>
              <p className="display mb-1.5 text-[1.35rem]">Your cart is empty</p>
              <p className="mb-7 max-w-64 text-sm text-muted-foreground">
                Browse our catalogue to find the perfect corporate gift.
              </p>
              <SheetClose asChild>
                <Button size="lg" asChild>
                  <Link href="/product">
                    Start Shopping <ArrowRight aria-hidden />
                  </Link>
                </Button>
              </SheetClose>
            </div>
          ) : (
            <ul className="divide-y divide-foreground/[0.08]">
              {items.map((product) => (
                <li key={product.id} className="group/item flex gap-4 py-4 first:pt-0 last:pb-0">
                  <SheetClose asChild>
                    <Link
                      href={`/product/${product.slug}`}
                      className="studio relative size-[4.5rem] shrink-0 overflow-hidden rounded-lg"
                      aria-label={product.name}
                    >
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="72px"
                        className="object-contain p-1 mix-blend-multiply transition-transform duration-300 group-hover/item:scale-105 dark:mix-blend-normal"
                      />
                    </Link>
                  </SheetClose>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <SheetClose asChild>
                        <Link
                          href={`/product/${product.slug}`}
                          className="line-clamp-2 text-[13.5px] font-semibold leading-snug transition-colors hover:text-primary"
                        >
                          {product.name}
                        </Link>
                      </SheetClose>
                      <button
                        onClick={() => removeProduct(product.id)}
                        className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Remove ${product.name} from cart`}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {product.variantLabel && <span className="font-semibold text-foreground">{product.variantLabel} · </span>}
                      {formatCurrency(product.price)} / pc
                      {product.minQuantity > 1 ? ` · min ${product.minQuantity}` : ""}
                    </p>

                    <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                      <div className="flex h-8 items-center rounded-lg border bg-background">
                        <button
                          className="grid size-8 place-items-center rounded-l-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                          onClick={() => updateQuantity(product.id, product.qty - 1)}
                          disabled={product.qty <= product.minQuantity}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-3.5" aria-hidden />
                        </button>
                        <span className="min-w-8 text-center text-[13px] font-bold tabular-nums" aria-live="polite">
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
                      <p className="numeral text-[15px]">{formatCurrency(product.price * product.qty)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="flex-shrink-0 space-y-4 border-t px-6 py-5">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-medium text-foreground tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span className="text-xs font-medium text-muted-foreground">By weight &amp; destination · at checkout</span>
              </div>
              <div className="flex items-baseline justify-between border-t border-foreground/[0.12] pt-2">
                <span className="text-[15px] font-semibold">Subtotal</span>
                <span className="numeral text-[1.5rem] leading-none">{formatCurrency(subtotal)}</span>
              </div>
            </div>

            <div className="grid gap-2">
              <SheetClose asChild>
                <Button size="lg" asChild className="w-full">
                  <Link href="/checkout">
                    Checkout <ArrowRight aria-hidden />
                  </Link>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/cart">View cart</Link>
                </Button>
              </SheetClose>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
