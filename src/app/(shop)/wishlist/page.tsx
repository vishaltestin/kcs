"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Heart, ShoppingCart, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { useWishlist } from "@/components/shop/wishlist-provider";
import { useCartStore } from "@/store/cart";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export default function WishlistPage() {
  // Reads through the wishlist provider: guests see their localStorage
  // items, signed-in users see their server-backed (per-user) items.
  const { items, remove: removeFromWishlist, clearAll } = useWishlist();
  const addProduct = useCartStore((state) => state.addProduct);

  const moveToCart = (item: (typeof items)[number]) => {
    addProduct({
      productId: item.id,
      variantId: null,
      variantLabel: null,
      slug: item.slug,
      name: item.name,
      image: item.image,
      price: item.price,
      mrp: item.price,
      qty: 1,
      minQuantity: 1,
      weightGrams: 0,
      dimensionsCm: null,
    });
    removeFromWishlist(item.id);
    toast.success("Moved to cart", { description: item.name });
  };

  const moveAll = () => {
    items.forEach((item) =>
      addProduct({
        productId: item.id,
        variantId: null,
        variantLabel: null,
        slug: item.slug,
        name: item.name,
        image: item.image,
        price: item.price,
        mrp: item.price,
        qty: 1,
        minQuantity: 1,
        weightGrams: 0,
        dimensionsCm: null,
      })
    );
    clearAll();
    toast.success(`Moved ${items.length} ${items.length === 1 ? "item" : "items"} to cart`);
  };

  return (
    <div>
      <div className="container pt-8 md:pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-foreground/[0.12] pb-6">
            <div>
              <span className="kicker text-primary">Saved for later</span>
              <h1 className="display mt-1.5 flex items-center gap-3 text-[2.25rem] md:text-[2.9rem]">
                Your Gifting Ideas
                <Heart className="size-6 text-primary" aria-hidden />
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {items.length === 0
                  ? "Nothing saved yet."
                  : `${items.length} ${items.length === 1 ? "product" : "products"} shortlisted`}
              </p>
            </div>
            {items.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={clearAll}>
                  <Trash2 aria-hidden /> Clear all
                </Button>
                <Button onClick={moveAll}>
                  <ShoppingCart aria-hidden /> Move all to cart
                </Button>
              </div>
            )}
        </div>
      </div>

      <div className="container py-8 md:py-10">
        {items.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Your wishlist is empty"
            description="Tap the heart on any product to save it here while you plan your corporate gifting."
            action={
              <Button asChild size="lg">
                <Link href="/product">
                  Explore Products <ArrowRight aria-hidden />
                </Link>
              </Button>
            }
          />
        ) : (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <li key={item.id} className="group/wl relative flex flex-col">
                <Link href={`/product/${item.slug}`} className="studio relative block aspect-square overflow-hidden rounded-xl">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-contain p-4 mix-blend-multiply transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/wl:scale-[1.04] dark:mix-blend-normal"
                  />
                  <span className="absolute right-3 bottom-3 grid size-9 translate-y-1 place-items-center rounded-full bg-white text-foreground opacity-0 shadow-lg transition-all duration-300 group-hover/wl:translate-y-0 group-hover/wl:opacity-100">
                    <ArrowUpRight className="size-4" aria-hidden />
                  </span>
                </Link>
                <button
                  onClick={() => removeFromWishlist(item.id)}
                  className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-white/90 text-primary shadow-md backdrop-blur transition-colors hover:bg-primary hover:text-primary-foreground"
                  aria-label={`Remove ${item.name} from wishlist`}
                >
                  <Heart className="size-4 fill-current" aria-hidden />
                </button>

                <div className="flex flex-1 flex-col pt-3.5">
                  {item.brand && (
                    <span className="text-[10.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">{item.brand}</span>
                  )}
                  <Link
                    href={`/product/${item.slug}`}
                    className="display mt-1 line-clamp-2 min-h-[2.6rem] text-[1.05rem] leading-snug transition-colors hover:text-primary"
                  >
                    {item.name}
                  </Link>
                  <p className="numeral mt-2 text-[1.2rem]">{formatCurrency(item.price)}</p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => moveToCart(item)}>
                      <ShoppingCart aria-hidden /> Add to Cart
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="outline"
                      className="size-8"
                      onClick={() => removeFromWishlist(item.id)}
                      aria-label={`Remove ${item.name} from wishlist`}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
