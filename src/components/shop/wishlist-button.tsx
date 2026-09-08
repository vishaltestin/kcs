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
          "grid size-9 place-items-center rounded-full bg-white/90 text-foreground shadow-[0_6px_16px_-6px_rgb(0_0_0/0.35)] ring-1 ring-black/5 backdrop-blur-md transition-all duration-200 hover:scale-105 hover:bg-white active:scale-95",
          isWishlistedNow && "bg-primary text-primary-foreground ring-primary/40 hover:bg-primary",
          className
        )}
      >
        <Heart
          className={cn(
            "size-4 transition-transform duration-300",
            isWishlistedNow && "scale-110 fill-current"
          )}
          aria-hidden
        />
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className={cn(
        "w-full",
        isWishlistedNow && "border-primary/40 bg-primary/[0.06] text-primary hover:bg-primary/10 hover:text-primary",
        className
      )}
      onClick={() => toggle(product)}
      aria-pressed={isWishlistedNow}
    >
      <Heart className={cn("size-4", isWishlistedNow && "fill-current")} aria-hidden />
      <span className="truncate">{isWishlistedNow ? "Saved to Ideas" : "Save to Ideas"}</span>
    </Button>
  );
}
