"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  MessageCircle,
  MessageSquareQuote,
  Minus,
  PackageCheck,
  PhoneCall,
  Plus,
  Scale,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore, cartLineId } from "@/store/cart";
import { WishlistButton } from "@/components/shop/wishlist-button";
import { BulkEnquiryDialog } from "@/components/shop/bulk-enquiry-dialog";
import { BulkInquiryTable } from "@/components/shop/bulk-inquiry-table";
import { VariantSelector } from "@/components/shop/variant-selector";
import { useVariantPreview } from "@/store/variant-preview";
import { cn, formatCurrency } from "@/lib/utils";
import { formatGrams } from "@/lib/shipping";
import { findVariant, type VariantAttributes } from "@/lib/variants";
import type { ProductDetail, ProductPriceTier } from "@/types";

/**
 * PDP purchase panel: variant picker (colour / size), quantity, tiered price
 * and add-to-cart. For variant products the price block, slab table, stock
 * and SKU all follow the selected variant.
 */
export function ProductActions({ product }: { product: ProductDetail }) {
  const addProduct = useCartStore((state) => state.addProduct);
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const hasVariants = product.options.length > 0 && product.variants.length > 0;
  const [selection, setSelection] = useState<VariantAttributes>(() => {
    // Pre-select when there's exactly one variant (or a single value per axis).
    if (product.options.length > 0 && product.options.every((o) => o.values.length === 1)) {
      return Object.fromEntries(product.options.map((o) => [o.name, o.values[0]]));
    }
    return {};
  });
  const variant = hasVariants ? findVariant(product.variants, selection, product.options) : undefined;
  const needsSelection = hasVariants && !variant;

  // Let the media stage mirror the chosen variant (its own photo is far more
  // useful at 640 px than in a chip next to the price).
  const setVariantPreview = useVariantPreview((state) => state.setPreview);
  const clearVariantPreview = useVariantPreview((state) => state.clearPreview);
  useEffect(() => {
    if (!hasVariants) {
      clearVariantPreview();
      return;
    }
    setVariantPreview(product.id, variant ? { image: variant.image, label: variant.label } : null);
  }, [product.id, hasVariants, variant, setVariantPreview, clearVariantPreview]);
  useEffect(() => () => clearVariantPreview(), [clearVariantPreview]);

  // Effective price tiers: variant's when selected, else the product's.
  const tiers: ProductPriceTier[] = useMemo(() => {
    const source = variant ? variant.prices : hasVariants ? [] : product.prices;
    return [...source].sort((a, b) => a.minQuantity - b.minQuantity);
  }, [variant, hasVariants, product.prices]);

  const minQty = product.pricingMode === "SINGLE" ? 1 : (tiers[0]?.minQuantity ?? product.minQuantity ?? 1);
  const [qty, setQty] = useState(minQty);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const lineId = cartLineId(product.id, variant?.id ?? null);
  const inCart = items.find((item) => item.id === lineId);

  const displayQty = Number.isFinite(qty) && qty > 0 ? Math.max(qty, minQty) : minQty;
  const sortedDesc = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity);
  const applicableTier = sortedDesc.find((t) => displayQty >= t.minQuantity) ?? tiers[0];
  const nextTier = tiers.find((t) => t.minQuantity > displayQty);
  const unitPrice = applicableTier?.price ?? (variant ? (variant.price ?? 0) : (product.price ?? 0));
  const unitMrp = applicableTier?.mrp ?? (variant ? (variant.mrp ?? 0) : (product.mrpPrice ?? 0));
  const isQuoteOnly = product.pricingMode === "ENQUIRY" || (!needsSelection && !(unitPrice > 0));
  const isBulk = product.pricingMode === "BULK" && minQty > 1;
  const stock = variant ? variant.stock : product.stock;
  const outOfStock = !needsSelection && !isQuoteOnly && stock <= 0;
  const lineTotal = unitPrice * displayQty;
  const weightGrams = product.weightGrams;
  const lineWeight = weightGrams > 0 ? weightGrams * displayQty : 0;

  const onSelectionChange = (next: VariantAttributes) => {
    setSelection(next);
    const v = findVariant(product.variants, next, product.options);
    const vTiers = v ? [...v.prices].sort((a, b) => a.minQuantity - b.minQuantity) : [];
    const nextMin = product.pricingMode === "SINGLE" ? 1 : (vTiers[0]?.minQuantity ?? 1);
    setQty((q) => Math.max(nextMin, Number.isFinite(q) ? q : nextMin));
  };

  const handleAddToCart = () => {
    if (isQuoteOnly) {
      toast.info("Available on enquiry", {
        description: "This product is quoted on request — use Enquire Now for pricing.",
      });
      return;
    }
    if (needsSelection) {
      const missing = product.options.filter((o) => !selection[o.name]).map((o) => o.name.toLowerCase());
      toast.info(`Choose a ${missing.join(" and ")}`, { description: "Pick your options to add this product." });
      return;
    }
    if (outOfStock) {
      toast.error("Out of stock", { description: "This option is currently unavailable — try another or enquire." });
      return;
    }
    const safeQty = Number.isFinite(qty) && qty >= minQty ? Math.floor(qty) : minQty;
    if (safeQty !== qty) setQty(safeQty);
    const tier = sortedDesc.find((t) => safeQty >= t.minQuantity) ?? tiers[0];
    addProduct({
      productId: product.id,
      variantId: variant?.id ?? null,
      variantLabel: variant?.label ?? null,
      slug: product.slug,
      name: product.name,
      image: variant?.image || product.image,
      price: tier?.price ?? unitPrice,
      mrp: tier?.mrp ?? unitMrp,
      qty: safeQty,
      minQuantity: minQty,
      weightGrams: product.weightGrams,
      dimensionsCm: product.dimensionsCm,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
    toast.success("Added to cart", {
      description: `${safeQty} × ${product.name}${variant ? ` (${variant.label})` : ""}`,
    });
  };

  const setQuantity = (value: number) => setQty(Math.max(minQty, Math.floor(value) || minQty));

  const whatsappHref = `https://wa.me/917838152753?text=${encodeURIComponent(
    `Hi! I'm interested in "${product.name}"${variant ? ` (${variant.label})` : ""} (https://kcsgmart.in/product/${product.slug}) for corporate gifting. Quantity: ${inCart?.qty ?? displayQty} pcs.`
  )}`;

  const discount = unitMrp > unitPrice && unitMrp > 0 ? Math.round(((unitMrp - unitPrice) / unitMrp) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Variant-aware price block */}
      {hasVariants && (
        <div className="border-y border-foreground/[0.12] py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {isQuoteOnly ? "Pricing" : needsSelection ? "Price" : isBulk ? "Starting at" : "Price"}
              </p>
              <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {isQuoteOnly ? (
                  <p className="kicker text-[1.6rem] leading-none">Price on request</p>
                ) : needsSelection ? (
                  <p className="numeral text-[2rem] leading-none md:text-[2.25rem]">
                    {product.priceRange
                      ? `${formatCurrency(product.priceRange.min)} – ${formatCurrency(product.priceRange.max)}`
                      : formatCurrency(product.price ?? 0)}
                  </p>
                ) : (
                  <>
                    <p className="numeral text-[2.6rem] leading-none">{formatCurrency(tiers[0]?.price ?? unitPrice)}</p>
                    {isBulk && <span className="text-sm font-medium text-muted-foreground">/ piece</span>}
                    {unitMrp > unitPrice && (
                      <>
                        <p className="numeral text-lg text-muted-foreground line-through">{formatCurrency(tiers[0]?.mrp ?? unitMrp)}</p>
                        <Badge className="rounded-md bg-primary px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase">
                          {discount}% off
                        </Badge>
                      </>
                    )}
                  </>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {needsSelection
                  ? "Select your options to see the exact price and stock."
                  : isBulk
                    ? `Slabs get cheaper from ${minQty}+ pcs · inclusive of all taxes`
                    : "Inclusive of all taxes · order from a single piece"}
              </p>
            </div>
            {variant && (
              <div className="flex items-center gap-3 rounded-xl bg-surface p-2.5 pr-4">
                {variant.image ? (
                  <button
                    type="button"
                    onClick={() => setVariantPreview(product.id, { image: variant.image, label: variant.label })}
                    className="studio relative size-24 shrink-0 overflow-hidden rounded-lg ring-1 ring-foreground/[0.07] transition-shadow hover:shadow-md"
                    aria-label={`Show the ${variant.label} photo in the gallery`}
                    title="Show in gallery"
                  >
                    <Image
                      src={variant.image}
                      alt={`${product.name} — ${variant.label}`}
                      fill
                      sizes="96px"
                      className="object-contain p-1.5 mix-blend-multiply dark:mix-blend-normal"
                    />
                  </button>
                ) : (
                  <span className="grid size-24 shrink-0 place-items-center rounded-lg bg-background text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ring-1 ring-foreground/[0.07]">
                    No photo
                  </span>
                )}
                <div className="text-xs">
                  <p className="text-sm font-bold">{variant.label}</p>
                  <p className="mt-0.5 text-muted-foreground">
                    {variant.sku ? `SKU ${variant.sku} · ` : ""}
                    {variant.stock > 0 ? <span className="text-success">{variant.stock} in stock</span> : <span className="text-destructive">Out of stock</span>}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {hasVariants && (
        <div>
          <VariantSelector
            options={product.options}
            variants={product.variants}
            selection={selection}
            onChange={onSelectionChange}
          />
        </div>
      )}

      {hasVariants && isBulk && variant && tiers.length > 1 && <BulkInquiryTable prices={tiers} />}

      {inCart ? (
        <div className="rounded-xl border border-success/30 bg-success/[0.06] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-full bg-success text-white">
                <Check className="size-4" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-bold">In your cart{inCart.variantLabel ? ` · ${inCart.variantLabel}` : ""}</p>
                <p className="text-xs text-muted-foreground">
                  {inCart.qty} pcs · {formatCurrency(inCart.price * inCart.qty)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 items-center rounded-lg border bg-background">
                <button
                  className="grid size-10 place-items-center rounded-l-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                  onClick={() => updateQuantity(inCart.id, inCart.qty - 1)}
                  disabled={inCart.qty <= inCart.minQuantity}
                  aria-label="Decrease quantity"
                >
                  <Minus className="size-4" aria-hidden />
                </button>
                <span className="min-w-10 text-center text-sm font-bold tabular-nums" aria-live="polite">
                  {inCart.qty}
                </span>
                <button
                  className="grid size-10 place-items-center rounded-r-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  onClick={() => updateQuantity(inCart.id, inCart.qty + 1)}
                  aria-label="Increase quantity"
                >
                  <Plus className="size-4" aria-hidden />
                </button>
              </div>
              <Button asChild size="lg">
                <Link href="/cart">
                  View cart <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : isQuoteOnly ? (
        <div className="relative overflow-hidden rounded-xl bg-brand-ink p-5 text-white">
          <span aria-hidden className="absolute -top-16 -right-16 size-48 rounded-full bg-primary/25 blur-3xl" />
          <div className="relative">
            <p className="kicker text-brand-amber">Quoted on request</p>
            <h3 className="display mt-1.5 text-[1.35rem] text-white">Tell us your quantity &amp; branding</h3>
            <p className="mt-1.5 max-w-md text-sm text-white/70">
              Pricing for this product depends on quantity, customisation and delivery location. Share your brief and a
              gifting manager will send a quote within a few hours.
            </p>
            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
              <Button size="xl" className="flex-1" onClick={() => setEnquiryOpen(true)}>
                <MessageSquareQuote aria-hidden /> Request a quote
              </Button>
              <Button asChild size="xl" variant="glass">
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                  <MessageCircle aria-hidden /> WhatsApp us
                </a>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <div className="flex h-12 items-center rounded-lg border border-foreground/20 bg-background">
              <button
                className="grid size-12 place-items-center rounded-l-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                onClick={() => setQuantity(qty - 1)}
                disabled={qty <= minQty}
                aria-label="Decrease quantity"
              >
                <Minus className="size-4" aria-hidden />
              </button>
              <label className="sr-only" htmlFor="pdp-qty">
                Quantity
              </label>
              <input
                id="pdp-qty"
                type="number"
                inputMode="numeric"
                min={minQty}
                value={Number.isFinite(qty) ? qty : ""}
                onChange={(e) => setQty(e.target.value === "" ? NaN : Number(e.target.value))}
                onBlur={(e) => setQuantity(Number(e.target.value))}
                className="numeral h-full w-16 bg-transparent text-center text-lg outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                className="grid size-12 place-items-center rounded-r-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => setQuantity(qty + 1)}
                aria-label="Increase quantity"
              >
                <Plus className="size-4" aria-hidden />
              </button>
            </div>
            <Button
              size="xl"
              className={cn("flex-1", outOfStock && "bg-muted text-muted-foreground hover:bg-muted")}
              onClick={handleAddToCart}
              aria-disabled={outOfStock}
            >
              {justAdded ? (
                <>
                  <Check aria-hidden /> Added
                </>
              ) : needsSelection ? (
                <>
                  <ShoppingCart aria-hidden /> Select options
                </>
              ) : outOfStock ? (
                <>Out of stock</>
              ) : (
                <>
                  <ShoppingCart aria-hidden /> Add to Cart · {formatCurrency(lineTotal)}
                </>
              )}
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              {isBulk && (
                <>
                  MOQ <strong className="text-foreground">{minQty}</strong> ·{" "}
                </>
              )}
              {needsSelection ? (
                "Unit price depends on the selected option"
              ) : (
                <>
                  Unit price{isBulk ? ` at ${displayQty} pcs` : ""}:{" "}
                  <strong className="text-foreground">{formatCurrency(unitPrice)}</strong>
                  {!isBulk && stock > 0 && <span className="text-success"> · In stock</span>}
                </>
              )}
            </span>
            {nextTier && nextTier.price < unitPrice && (
              <button
                onClick={() => setQuantity(nextTier.minQuantity)}
                className="inline-flex items-center gap-1 rounded-md bg-primary/[0.08] px-2 py-1 font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Order {nextTier.minQuantity}+ for {formatCurrency(nextTier.price)}/pc
              </button>
            )}
          </div>

          {(lineWeight > 0 || product.dimensionsCm) && (
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Scale className="size-3.5" aria-hidden />
                {weightGrams > 0 ? `${formatGrams(weightGrams)} each` : "Weight on request"}
                {lineWeight > 0 && displayQty > 1 ? ` · ${formatGrams(lineWeight)} total` : ""}
              </span>
              {product.dimensionsCm && (
                <span className="inline-flex items-center gap-1">
                  <PackageCheck className="size-3.5" aria-hidden />
                  {product.dimensionsCm.length} × {product.dimensionsCm.width} × {product.dimensionsCm.height} cm
                </span>
              )}
              <span>· Shipping calculated at checkout by weight &amp; destination</span>
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        <WishlistButton
          variant="full"
          product={{
            id: product.id,
            slug: product.slug,
            name: product.name,
            image: product.image,
            price: product.price ?? 0,
            brand: product.brand,
          }}
        />
        <Button variant="outline" size="lg" onClick={() => setEnquiryOpen(true)}>
          <PhoneCall aria-hidden /> Enquire Now
        </Button>
      </div>

      {!isQuoteOnly && (
        <Button
          asChild
          size="lg"
          className="w-full bg-[#25D366] text-white hover:bg-[#1ebe5b] focus-visible:ring-[#25D366]/40"
        >
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <MessageCircle aria-hidden /> Enquire on WhatsApp
          </a>
        </Button>
      )}

      <BulkEnquiryDialog
        open={enquiryOpen}
        onOpenChange={setEnquiryOpen}
        productId={product.id}
        productName={variant ? `${product.name} (${variant.label})` : product.name}
      />
    </div>
  );
}
