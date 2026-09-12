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
 * Catalogue tile. Deliberately *not* a boxed card: the product sits on a warm
 * studio plate with a soft inner shadow, and the copy underneath is set like
 * a catalogue caption — small-caps brand line, bold product name, tabular
 * numerals for the price and a hairline footer with the MOQ / savings note.
 * Badges are thin ink or red tabs at the top-left; the wishlist heart floats
 * top-right; a quick-add bar slides up over the image on pointer devices
 * (a compact round button stands in for it on touch).
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
    <article className={cn("group/product relative flex h-full flex-col", className)}>
      {/* Image plate */}
      <div className="studio relative aspect-square overflow-hidden rounded-xl shadow-[inset_0_0_0_1px_rgb(17_24_39/0.05)] transition-shadow duration-300 group-hover/product:shadow-[inset_0_0_0_1px_rgb(17_24_39/0.1),0_18px_36px_-22px_rgb(17_24_39/0.3)]">
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
            className="object-contain p-3 mix-blend-multiply transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/product:scale-[1.04] sm:p-4 dark:mix-blend-normal"
          />
          {/* soft studio vignette so white-background product shots don't look pasted on */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_70%_at_50%_100%,rgb(17_24_39/0.06),transparent_62%)]"
          />
        </Link>

        {/* Badges — thin tabs bleeding off the top-left edge */}
        <div className="pointer-events-none absolute top-0 left-0 z-10 flex flex-col items-start gap-1">
          {discount && (
            <span className="rounded-br-lg bg-primary px-2.5 py-1.5 text-[10.5px] font-bold leading-none tracking-[0.08em] text-primary-foreground">
              −{discount}%
            </span>
          )}
          {product.isNew && (
            <span className="rounded-r-md bg-foreground px-2.5 py-1.5 text-[10.5px] font-bold leading-none tracking-[0.08em] text-background">
              NEW
            </span>
          )}
          {product.isBestSeller && (
            <span className="rounded-r-md bg-brand-amber px-2.5 py-1.5 text-[10.5px] font-bold leading-none tracking-[0.08em] text-[#3d2a00]">
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
          className="absolute top-2.5 right-2.5 z-10"
        />

        {/* Hover action bar */}
        {product.isActive && (
          <div className="absolute inset-x-2.5 bottom-2.5 z-10 hidden gap-1.5 transition-all duration-300 ease-out sm:flex sm:translate-y-3 sm:opacity-0 sm:group-hover/product:translate-y-0 sm:group-hover/product:opacity-100 sm:group-focus-within/product:translate-y-0 sm:group-focus-within/product:opacity-100">
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={added}
              aria-label={`Quick add ${product.name} to cart`}
              className={cn(
                "flex h-10 flex-1 items-center justify-center gap-2 rounded-lg text-[12.5px] font-semibold shadow-[0_10px_24px_-10px_rgb(0_0_0/0.45)] backdrop-blur-md transition-colors duration-200",
                added
                  ? "bg-success text-success-foreground"
                  : cartItem
                    ? "bg-foreground text-background hover:bg-primary hover:text-primary-foreground"
                    : "bg-white/95 text-foreground hover:bg-foreground hover:text-background"
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
              className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/95 text-foreground shadow-[0_10px_24px_-10px_rgb(0_0_0/0.45)] backdrop-blur-md transition-colors hover:bg-foreground hover:text-background"
            >
              <Eye className="size-4" aria-hidden />
            </Link>
          </div>
        )}
      </div>

      {/* Caption */}
      <div className="flex flex-1 flex-col px-0.5 pt-3.5">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {product.brand ?? "KCS G-Mart"}
          </span>
          {isBulk && (
            <span className="inline-flex shrink-0 items-center gap-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <Layers className="size-3" aria-hidden /> MOQ {product.minQuantity}
            </span>
          )}
          {isEnquiry && (
            <span className="shrink-0 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-amber-700">
              Quote only
            </span>
          )}
        </div>

        <Link
          href={`/product/${product.slug}`}
          className="display mt-1.5 line-clamp-2 min-h-[2.65rem] text-[1.02rem] leading-[1.3] tracking-normal text-wrap text-foreground transition-colors hover:text-primary sm:text-[1.08rem]"
        >
          {product.name}
        </Link>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {!isEnquiry && product.price ? (
            <>
              {product.priceRange && <span className="text-[11px] font-medium text-muted-foreground">from</span>}
              <p className="numeral text-[1.25rem] text-foreground sm:text-[1.3rem]">{formatCurrency(product.price)}</p>
              {product.mrpPrice && product.mrpPrice > product.price && (
                <p className="numeral text-[13px] text-muted-foreground line-through decoration-muted-foreground/50">
                  {formatCurrency(product.mrpPrice)}
                </p>
              )}
              {isBulk && <span className="text-[11px] text-muted-foreground">/ pc</span>}
            </>
          ) : (
            <p className="kicker text-[1.02rem] text-foreground/80">Price on request</p>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-foreground/[0.08] pt-2.5 mt-3">
          <span className={cn("text-[12px]", savings ? "font-semibold text-success" : "text-muted-foreground")}>
            {savings
              ? `You save ${formatCurrency(savings)}`
              : isEnquiry
                ? "Custom quote in hours"
                : hasVariants
                  ? `${product.variantCount} variants`
                  : isBulk
                    ? "Tiered bulk pricing"
                    : "Ready to ship"}
          </span>
          <Link
            href={`/product/${product.slug}`}
            className="group/link hidden items-center gap-1 text-[12px] font-semibold text-foreground transition-colors hover:text-primary sm:inline-flex"
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
