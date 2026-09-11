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
      <div className="border-b bg-surface/70">
        <div className="container mx-auto px-4 pt-7 pb-8 md:pt-9">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-primary">Saved for later</p>
              <h1 className="mt-1 flex items-center gap-3 text-3xl font-extrabold tracking-tight md:text-4xl">
                Your Gifting Ideas
                <span className="grid size-9 place-items-center rounded-full bg-primary/[0.08] text-primary">
                  <Heart className="size-4.5" aria-hidden />
                </span>
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
      </div>

      <div className="container mx-auto px-4 py-8 md:py-10">
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
          <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <li
                key={item.id}
                className="group/wl relative flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/[0.07] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_24px_48px_-24px_rgb(0_0_0/0.35)]"
              >
                <Link href={`/product/${item.slug}`} className="relative block aspect-square overflow-hidden bg-muted">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/wl:scale-[1.06]"
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

                <div className="flex flex-1 flex-col p-4">
                  {item.brand && (
                    <span className="text-[11px] font-bold tracking-[0.12em] text-muted-foreground uppercase">{item.brand}</span>
                  )}
                  <Link
                    href={`/product/${item.slug}`}
                    className="mt-1 line-clamp-2 min-h-[2.6rem] text-[14px] font-semibold leading-snug transition-colors hover:text-primary"
                  >
                    {item.name}
                  </Link>
                  <p className="mt-2 text-lg font-extrabold tracking-tight tabular-nums">{formatCurrency(item.price)}</p>
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
