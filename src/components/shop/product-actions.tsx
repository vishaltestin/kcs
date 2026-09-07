"use client";

import { useState } from "react";

import { Minus, Phone, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import { WishlistButton } from "@/components/shop/wishlist-button";
import { BulkEnquiryDialog } from "@/components/shop/bulk-enquiry-dialog";
import type { ProductDetail } from "@/types";

export function ProductActions({ product }: { product: ProductDetail }) {
  const addProduct = useCartStore((state) => state.addProduct);
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const minQty = product.minQuantity || 1;
  const [qty, setQty] = useState(minQty);
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  const inCart = items.find((item) => item.id === product.id);

  // Unit price for the selected quantity (tiered bulk pricing).
  const applicableTier =
    [...product.prices].sort((a, b) => b.minQuantity - a.minQuantity).find((t) => qty >= t.minQuantity) ??
    product.prices[0];

  const handleAddToCart = () => {
    addProduct({
      id: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      price: applicableTier?.price ?? product.price ?? 0,
      mrp: applicableTier?.mrp ?? product.mrpPrice ?? 0,
      qty,
      minQuantity: minQty,
    });
    toast.success("Added to cart", {
      description: `${qty} × ${product.name}`,
    });
  };

  return (
    <div className="grid grid-cols-1 gap-2">
      {inCart ? (
        <div className="flex items-center justify-between border rounded-lg px-3 py-2">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">In cart</span>
            <div className="flex items-center border rounded-md">
              <button
                className="p-2 hover:bg-muted rounded-l-md disabled:opacity-40"
                onClick={() => updateQuantity(product.id, inCart.qty - 1)}
                disabled={inCart.qty <= inCart.minQuantity}
                aria-label="Decrease quantity"
              >
                <Minus className="h-3 w-3" aria-hidden />
              </button>
              <span className="px-3 text-sm font-semibold tabular-nums" aria-live="polite">
                {inCart.qty}
              </span>
              <button
                className="p-2 hover:bg-muted rounded-r-md"
                onClick={() => updateQuantity(product.id, inCart.qty + 1)}
                aria-label="Increase quantity"
              >
                <Plus className="h-3 w-3" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex items-center border rounded-md">
            <button
              className="p-3 hover:bg-muted rounded-l-md disabled:opacity-40"
              onClick={() => setQty((q) => Math.max(minQty, q - 1))}
              disabled={qty <= minQty}
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" aria-hidden />
            </button>
            <span className="px-4 text-base font-semibold tabular-nums" aria-live="polite">
              {qty}
            </span>
            <button
              className="p-3 hover:bg-muted rounded-r-md"
              onClick={() => setQty((q) => q + 1)}
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <Button className="flex-1" onClick={handleAddToCart}>
            <ShoppingCart className="mr-2 h-4 w-4" aria-hidden /> Add to Cart
          </Button>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Minimum order quantity: <strong>{minQty}</strong> · Unit price at {qty} pcs:{" "}
        <strong>₹{applicableTier?.price ?? "—"}</strong>
      </p>

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

      <Button variant="secondary" className="w-full" onClick={() => setEnquiryOpen(true)}>
        <Phone className="mr-2 h-4 w-4" aria-hidden /> Enquire Now
      </Button>

      <a
        href={`https://wa.me/917838152753?text=${encodeURIComponent(
          `Hi! I'm interested in "${product.name}" (https://kcsgmart.in/product/${product.slug}) for corporate gifting.`
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full"
      >
        <Button variant="secondary" className="w-full bg-green-500 hover:bg-green-600 text-white">
          Enquire on WhatsApp
        </Button>
      </a>

      <BulkEnquiryDialog
        open={enquiryOpen}
        onOpenChange={setEnquiryOpen}
        productId={product.id}
        productName={product.name}
      />
    </div>
  );
}
