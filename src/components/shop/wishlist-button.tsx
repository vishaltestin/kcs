"use client";

import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useWishlist } from "@/components/shop/wishlist-provider";
import { cn } from "@/lib/utils";
import type { WishlistItem } from "@/types";

/**
 * Toggle wishlist ("gifting ideas") membership. Guests use localStorage;
 * signed-in users mirror every toggle to the per-user server wishlist via
 * the provider — see wishlist-provider.tsx.
 */
export function WishlistButton({
  product,
  className,
  variant = "icon",
}: {
  product: WishlistItem;
  className?: string;
  variant?: "icon" | "full";
}) {
  const { isWishlisted, toggle } = useWishlist();
  const isWishlistedNow = isWishlisted(product.id);

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={() => toggle(product)}
        aria-label={
          isWishlistedNow ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`
        }
        aria-pressed={isWishlistedNow}
        className={cn(
          "bg-white/90 hover:bg-white text-foreground rounded-full p-2 shadow-md transition-colors",
          className
        )}
      >
        <Heart
          className={cn("h-4 w-4", isWishlistedNow && "text-primary fill-primary")}
          aria-hidden
        />
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={cn("w-full", isWishlistedNow && "border-primary text-primary", className)}
      onClick={() => toggle(product)}
      aria-pressed={isWishlistedNow}
    >
      <Heart className={cn("mr-2 h-4 w-4", isWishlistedNow && "fill-primary")} aria-hidden />
      {isWishlistedNow ? "Remove from Wishlist" : "Add to Wishlist"}
    </Button>
  );
}
