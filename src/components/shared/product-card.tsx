"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Eye, Layers, MessageSquareQuote, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { WishlistButton } from "@/components/shop/wishlist-button";
import { useCartStore } from "@/store/cart";
import { cn, formatCurrency } from "@/lib/utils";
import type { ProductListItem } from "@/types";

/**
 * Catalogue card. Layout, from top to bottom:
 *  - square image on a warm off-white "studio" backdrop with a soft inner
 *    vignette, badges top-left, wishlist top-right, and a hover action bar
 *    (Quick add + Quick view) that rises from the bottom edge on pointer
 *    devices (always visible on touch).
 *  - brand · MOQ meta row, two-line name, price row with MRP + "you save".
 *  - a slim CTA row that reads as a footer.
 */
export function ProductCard({
  product,
  className,
  priority = false,
}: {
  product: ProductListItem;
  className?: string;
  priority?: boolean;
}) {
  const addProduct = useCartStore((state) => state.addProduct);
  const cartItem = useCartStore((state) => state.items.find((item) => item.productId === product.id));
  const [added, setAdded] = useState(false);

  const discount =
    product.mrpPrice && product.price && product.mrpPrice > product.price
      ? Math.round(((product.mrpPrice - product.price) / product.mrpPrice) * 100)
      : null;
  const savings =
    product.mrpPrice && product.price && product.mrpPrice > product.price
      ? product.mrpPrice - product.price
      : null;

  const isEnquiry = product.pricingMode === "ENQUIRY" || !product.price;
  const isBulk = product.pricingMode === "BULK" && product.minQuantity > 1;

  const hasVariants = product.variantCount > 0;

  const handleQuickAdd = () => {
    if (isEnquiry || !product.price) {
      toast.info("Quoted on request", {
        description: "Open the product to request a quote for this item.",
      });
      return;
    }
    if (hasVariants) {
      toast.info("Choose a variant", {
        description: "Open the product to pick a colour / size before adding.",
      });
      return;
    }
    addProduct({
      productId: product.id,
      variantId: null,
      variantLabel: null,
      slug: product.slug,
      name: product.name,
      image: product.image,
      price: product.price,
      mrp: product.mrpPrice ?? product.price,
      qty: product.minQuantity || 1,
      minQuantity: product.minQuantity || 1,
      weightGrams: 0,
      dimensionsCm: null,
    });
    setAdded(true);
    toast.success("Added to cart", { description: `${product.minQuantity} × ${product.name}` });
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <article
      className={cn(
        "group/product relative flex h-full flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/[0.07] transition-[transform,box-shadow,ring-color] duration-300 ease-out",
        "hover:-translate-y-1 hover:shadow-[0_20px_40px_-18px_rgb(17_24_39/0.22),0_6px_14px_-8px_rgb(17_24_39/0.08)] hover:ring-foreground/[0.12]",
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-[oklch(0.975_0.004_80)]">
        <Link
          href={`/product/${product.slug}`}
          aria-label={product.name}
          className="absolute inset-0"
          tabIndex={-1}
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1400px) 25vw, 340px"
            quality={85}
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/product:scale-[1.06]"
          />
          {/* soft studio vignette so white-background product shots don't look pasted on */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_100%,rgb(17_24_39/0.06),transparent_60%)]"
          />
        </Link>

        {/* Badges */}
        <div className="pointer-events-none absolute top-2.5 left-2.5 z-10 flex flex-col items-start gap-1.5 sm:top-3 sm:left-3">
          {discount && (
            <span className="rounded-md bg-primary px-2 py-1 text-[11px] font-bold leading-none tracking-wide text-primary-foreground shadow-[0_4px_10px_-4px_oklch(0.545_0.206_25.5/0.8)]">
              {discount}% OFF
            </span>
          )}
          {product.isNew && (
            <span className="rounded-md bg-foreground px-2 py-1 text-[11px] font-bold leading-none tracking-wide text-background shadow-md">
              NEW
            </span>
          )}
          {product.isBestSeller && (
            <span className="rounded-md bg-brand-amber px-2 py-1 text-[11px] font-bold leading-none tracking-wide text-[#3d2a00] shadow-md">
              BESTSELLER
            </span>
          )}
        </div>

        <WishlistButton
          product={{
            id: product.id,
            slug: product.slug,
            name: product.name,
            image: product.image,
            price: product.price ?? 0,
            brand: product.brand,
          }}
          className="absolute top-2.5 right-2.5 z-10 sm:top-3 sm:right-3"
        />

        {/* Hover action bar */}
        {product.isActive && (
          <div className="absolute inset-x-3 bottom-3 z-10 hidden gap-2 transition-all duration-300 ease-out sm:flex sm:translate-y-3 sm:opacity-0 sm:group-hover/product:translate-y-0 sm:group-hover/product:opacity-100 sm:group-focus-within/product:translate-y-0 sm:group-focus-within/product:opacity-100">
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={added}
              aria-label={`Quick add ${product.name} to cart`}
              className={cn(
                "flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-[13px] font-semibold shadow-[0_10px_24px_-10px_rgb(0_0_0/0.45)] backdrop-blur-md transition-colors duration-200",
                added
                  ? "bg-success text-success-foreground"
                  : cartItem
                    ? "bg-foreground text-background hover:bg-primary hover:text-primary-foreground"
                    : "bg-white/95 text-foreground hover:bg-primary hover:text-primary-foreground"
              )}
            >
              {added ? (
                <>
                  <Check className="size-4" aria-hidden /> Added
                </>
              ) : cartItem ? (
                <>
                  <ShoppingBag className="size-4" aria-hidden /> In cart · {cartItem.qty}
                </>
              ) : isEnquiry ? (
                <>
                  <MessageSquareQuote className="size-4" aria-hidden /> Request a quote
                </>
              ) : hasVariants ? (
                <>
                  <ShoppingBag className="size-4" aria-hidden /> Choose options
                </>
              ) : (
                <>
                  <ShoppingBag className="size-4" aria-hidden />
                  Quick add{isBulk ? ` · ${product.minQuantity} pcs` : ""}
                </>
              )}
            </button>
            <Link
              href={`/product/${product.slug}`}
              aria-label={`View ${product.name}`}
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/95 text-foreground shadow-[0_10px_24px_-10px_rgb(0_0_0/0.45)] backdrop-blur-md transition-colors hover:bg-foreground hover:text-background"
            >
              <Eye className="size-4" aria-hidden />
            </Link>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-3 pt-3 sm:p-4 sm:pt-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {product.brand ?? "KCS G-Mart"}
          </span>
          {isBulk && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground">
              <Layers className="size-3" aria-hidden /> MOQ {product.minQuantity}
            </span>
          )}
          {isEnquiry && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-amber/15 px-2 py-0.5 text-[10.5px] font-semibold text-amber-800">
              Quote only
            </span>
          )}
        </div>

        <Link
          href={`/product/${product.slug}`}
          className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-[14px] font-semibold leading-snug text-foreground transition-colors hover:text-primary sm:min-h-[2.6rem] sm:text-[15px]"
        >
          {product.name}
        </Link>

        <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p className="text-[1.05rem] font-extrabold tracking-tight text-foreground sm:text-[1.15rem]">
            {!isEnquiry && product.price ? (
              <>
                {product.priceRange && <span className="mr-1 text-[11px] font-semibold text-muted-foreground">from</span>}
                {formatCurrency(product.price)}
              </>
            ) : (
              "Price on request"
            )}
          </p>
          {product.mrpPrice && product.price && product.mrpPrice > product.price && (
            <p className="text-[13px] text-muted-foreground line-through decoration-muted-foreground/60">
              {formatCurrency(product.mrpPrice)}
            </p>
          )}
          {!isEnquiry && product.price && isBulk && (
            <span className="text-[11px] text-muted-foreground">/ pc</span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          {savings ? (
            <span className="text-[12px] font-semibold text-success">
              You save {formatCurrency(savings)}
            </span>
          ) : (
            <span className="text-[12px] text-muted-foreground">
              {isEnquiry
                ? "Custom quote in hours"
                : hasVariants
                  ? `${product.variantCount} variants`
                  : isBulk
                    ? "Tiered bulk pricing"
                    : "Ready to ship"}
            </span>
          )}
          <Link
            href={`/product/${product.slug}`}
            className="group/link hidden items-center gap-1 text-[12.5px] font-bold text-foreground transition-colors hover:text-primary sm:inline-flex"
          >
            Details
            <span aria-hidden className="transition-transform duration-300 group-hover/link:translate-x-0.5">
              →
            </span>
          </Link>
          {/* Mobile: compact quick-add (hover bar is unavailable on touch) */}
          {product.isActive && (
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={added}
              aria-label={`Quick add ${product.name} to cart`}
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-full transition-colors sm:hidden",
                added
                  ? "bg-success text-success-foreground"
                  : cartItem
                    ? "bg-foreground text-background"
                    : "bg-primary text-primary-foreground active:bg-brand-deep"
              )}
            >
              {added ? <Check className="size-4" aria-hidden /> : <ShoppingBag className="size-4" aria-hidden />}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
