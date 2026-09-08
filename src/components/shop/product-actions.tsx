"use client";

import { useState } from "react";

import Link from "next/link";
import { ArrowRight, Check, MessageCircle, Minus, PhoneCall, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import { WishlistButton } from "@/components/shop/wishlist-button";
import { BulkEnquiryDialog } from "@/components/shop/bulk-enquiry-dialog";
import { formatCurrency } from "@/lib/utils";
import type { ProductDetail } from "@/types";

export function ProductActions({ product }: { product: ProductDetail }) {
  const addProduct = useCartStore((state) => state.addProduct);
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const minQty = product.minQuantity || 1;
  const [qty, setQty] = useState(minQty);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const inCart = items.find((item) => item.id === product.id);

  // Unit price for the selected quantity (tiered bulk pricing).
  const sortedTiers = [...product.prices].sort((a, b) => b.minQuantity - a.minQuantity);
  const applicableTier = sortedTiers.find((t) => qty >= t.minQuantity) ?? product.prices[0];
  const nextTier = [...product.prices]
    .sort((a, b) => a.minQuantity - b.minQuantity)
    .find((t) => t.minQuantity > qty);
  const unitPrice = applicableTier?.price ?? product.price ?? 0;
  // No tier and no base price → quote-only product; the cart must not accept it.
  const isQuoteOnly = !(unitPrice > 0);
  // Display-safe quantity (input may be mid-edit) so the button never shows "₹NaN".
  const displayQty = Number.isFinite(qty) && qty > 0 ? qty : minQty;
  const lineTotal = unitPrice * displayQty;

  const handleAddToCart = () => {
    if (isQuoteOnly) {
      toast.info("Available on enquiry", {
        description: "This product is quoted on request — use Enquire Now for pricing.",
      });
      return;
    }
    // The qty input can transiently hold 0 / NaN while the user is typing —
    // never let that reach the cart.
    const safeQty = Number.isFinite(qty) && qty >= minQty ? Math.floor(qty) : minQty;
    if (safeQty !== qty) setQty(safeQty);
    const tier = sortedTiers.find((t) => safeQty >= t.minQuantity) ?? product.prices[0];
    addProduct({
      id: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      price: tier?.price ?? product.price ?? 0,
      mrp: tier?.mrp ?? product.mrpPrice ?? 0,
      qty: safeQty,
      minQuantity: minQty,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
    toast.success("Added to cart", {
      description: `${safeQty} × ${product.name}`,
    });
  };

  const setQuantity = (value: number) => setQty(Math.max(minQty, Math.floor(value) || minQty));

  const whatsappHref = `https://wa.me/917838152753?text=${encodeURIComponent(
    `Hi! I'm interested in "${product.name}" (https://kcsgmart.in/product/${product.slug}) for corporate gifting. Quantity: ${inCart?.qty ?? qty} pcs.`
  )}`;

  return (
    <div className="space-y-4">
      {inCart ? (
        <div className="rounded-2xl bg-success/[0.07] p-4 ring-1 ring-success/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-full bg-success text-white">
                <Check className="size-4" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-bold">In your cart</p>
                <p className="text-xs text-muted-foreground">
                  {inCart.qty} pcs · {formatCurrency(inCart.price * inCart.qty)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 items-center rounded-lg border bg-background">
                <button
                  className="grid size-10 place-items-center rounded-l-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                  onClick={() => updateQuantity(product.id, inCart.qty - 1)}
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
                  onClick={() => updateQuantity(product.id, inCart.qty + 1)}
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
      ) : (
        <div className="rounded-2xl bg-card p-4 ring-1 ring-foreground/[0.07]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <div className="flex h-12 items-center rounded-xl border bg-background">
              <button
                className="grid size-12 place-items-center rounded-l-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
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
                className="h-full w-16 bg-transparent text-center text-base font-bold tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                className="grid size-12 place-items-center rounded-r-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => setQuantity(qty + 1)}
                aria-label="Increase quantity"
              >
                <Plus className="size-4" aria-hidden />
              </button>
            </div>
            <Button size="xl" className="flex-1" onClick={handleAddToCart} disabled={isQuoteOnly}>
              {justAdded ? (
                <>
                  <Check aria-hidden /> Added
                </>
              ) : isQuoteOnly ? (
                <>
                  <ShoppingCart aria-hidden /> Price on request
                </>
              ) : (
                <>
                  <ShoppingCart aria-hidden /> Add to Cart · {formatCurrency(lineTotal)}
                </>
              )}
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              MOQ <strong className="text-foreground">{minQty}</strong> · Unit price at {displayQty} pcs:{" "}
              <strong className="text-foreground">{formatCurrency(unitPrice)}</strong>
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

      <Button
        asChild
        size="lg"
        className="w-full bg-[#25D366] text-white hover:bg-[#1ebe5b] focus-visible:ring-[#25D366]/40"
      >
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
          <MessageCircle aria-hidden /> Enquire on WhatsApp
        </a>
      </Button>

      <BulkEnquiryDialog
        open={enquiryOpen}
        onOpenChange={setEnquiryOpen}
        productId={product.id}
        productName={product.name}
      />
    </div>
  );
}
