"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WishlistButton } from "@/components/shop/wishlist-button";
import { useCartStore } from "@/store/cart";
import { formatCurrency } from "@/lib/utils";
import type { ProductListItem } from "@/types";

export function ProductCard({ product }: { product: ProductListItem }) {
  const addProduct = useCartStore((state) => state.addProduct);
  const [added, setAdded] = useState(false);

  const discount =
    product.mrpPrice && product.price && product.mrpPrice > product.price
      ? Math.round(((product.mrpPrice - product.price) / product.mrpPrice) * 100)
      : null;

  const handleQuickAdd = () => {
    if (!product.price) {
      toast.info("Bulk enquiry", {
        description: "This product is quoted on request — open it to enquire.",
      });
      return;
    }
    addProduct({
      id: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      price: product.price,
      mrp: product.mrpPrice ?? product.price,
      qty: product.minQuantity || 1,
      minQuantity: product.minQuantity || 1,
    });
    setAdded(true);
    toast.success("Added to cart", { description: `${product.minQuantity} × ${product.name}` });
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <Card className="group/product relative flex h-full flex-col gap-0 py-0 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl">
      <CardContent className="relative p-0">
        <div className="relative aspect-square overflow-hidden">
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
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 280px"
              className="object-cover transition-transform duration-700 ease-out group-hover/product:scale-110"
            />
          </Link>

          {/* Badges */}
          <div className="pointer-events-none absolute top-3 left-3 z-10 flex flex-col items-start gap-1.5">
            {discount && (
              <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold tracking-wide text-primary-foreground shadow-md">
                {discount}% OFF
              </span>
            )}
            {product.isNew && !discount && (
              <span className="rounded-full bg-foreground px-2.5 py-1 text-[11px] font-bold tracking-wide text-background shadow-md">
                NEW
              </span>
            )}
            {product.isBestSeller && (
              <span className="rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold tracking-wide text-amber-950 shadow-md">
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
            className="absolute top-3 right-3 z-10"
          />

          {/* Quick add — slides up on hover (tap target always visible on touch) */}
          {product.isActive && (
            <div className="absolute inset-x-3 bottom-3 z-10 translate-y-2 opacity-100 transition-all duration-300 sm:translate-y-3 sm:opacity-0 sm:group-hover/product:translate-y-0 sm:group-hover/product:opacity-100">
              <Button
                size="sm"
                onClick={handleQuickAdd}
                disabled={added}
                className="h-10 w-full rounded-xl bg-white/95 text-foreground shadow-lg backdrop-blur-sm hover:bg-primary hover:text-primary-foreground"
                aria-label={`Quick add ${product.name} to cart`}
              >
                {added ? (
                  <>
                    <Check className="size-4" aria-hidden /> Added
                  </>
                ) : (
                  <>
                    <ShoppingCart className="size-4" aria-hidden /> Quick Add
                    {product.minQuantity > 1 ? ` · ${product.minQuantity} pcs` : ""}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-1 flex-col items-start gap-1.5 bg-card p-4 pt-3.5">
        {product.brand && (
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {product.brand}
          </span>
        )}
        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-2 min-h-[2.75rem] text-[15px] font-medium leading-snug text-foreground transition-colors hover:text-primary"
        >
          {product.name}
        </Link>

        <div className="mt-0.5 flex w-full flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p className="text-lg font-bold text-foreground">
            {product.price ? formatCurrency(product.price) : "Price on request"}
          </p>
          {product.mrpPrice && product.price && product.mrpPrice > product.price && (
            <p className="text-sm text-muted-foreground line-through">
              {formatCurrency(product.mrpPrice)}
            </p>
          )}
        </div>
        {product.minQuantity > 1 && (
          <p className="text-xs text-muted-foreground">
            Min. order {product.minQuantity} pcs · tiered bulk pricing
          </p>
        )}

        <Button asChild variant="outline" size="sm" className="group/view mt-auto w-full">
          <Link href={`/product/${product.slug}`}>
            View Details
            <ArrowRight
              className="ml-1 size-4 transition-transform duration-300 group-hover/view:translate-x-1"
              aria-hidden
            />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
