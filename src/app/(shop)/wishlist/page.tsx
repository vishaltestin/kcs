"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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
      id: item.id,
      slug: item.slug,
      name: item.name,
      image: item.image,
      price: item.price,
      mrp: item.price,
      qty: 1,
      minQuantity: 1,
    });
    removeFromWishlist(item.id);
    toast.success("Moved to cart", { description: item.name });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Gifting Ideas</h1>

      {items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Tap the heart on any product to save it here while you plan your corporate gifting."
          action={
            <Button asChild>
              <Link href="/product">Explore Products</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="flex justify-end mb-4">
            <Button variant="ghost" onClick={clearAll} className="text-muted-foreground">
              <Trash2 className="mr-2 h-4 w-4" aria-hidden /> Clear wishlist
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <Card key={item.id} className="gap-0 py-0 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg">
                <CardContent className="p-0">
                  <Link href={`/product/${item.slug}`}>
                    <div className="relative aspect-square overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover"
                      />
                    </div>
                  </Link>
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-2 bg-card p-4 pt-3.5">
                  {item.brand && (
                    <span className="text-xs text-muted-foreground uppercase font-semibold">
                      {item.brand}
                    </span>
                  )}
                  <Link
                    href={`/product/${item.slug}`}
                    className="line-clamp-2 min-h-[2.75rem] font-medium leading-snug hover:text-primary"
                  >
                    {item.name}
                  </Link>
                  <p className="text-lg font-bold">{formatCurrency(item.price)}</p>
                  <div className="flex gap-2 w-full mt-1">
                    <Button size="sm" className="flex-1" onClick={() => moveToCart(item)}>
                      <ShoppingCart className="mr-1.5 h-4 w-4" aria-hidden /> Add to Cart
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => removeFromWishlist(item.id)}
                      aria-label={`Remove ${item.name} from wishlist`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
