"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/shared/empty-state";
import { useCartStore } from "@/store/cart";
import { formatCurrency } from "@/lib/utils";

export default function CartPage() {
  const { items, removeProduct, updateQuantity, reset } = useCartStore();

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = subtotal > 0 ? (subtotal >= 1000 ? 0 : 100) : 0;
  const total = subtotal + shipping;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Looks like you haven't added anything yet. Explore our corporate gifting catalogue."
          action={
            <Button asChild>
              <Link href="/product">Start Shopping</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ul>
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col sm:flex-row items-center gap-4 py-4 border-b"
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded"
                    height={96}
                    width={96}
                  />
                  <div className="flex-grow text-center sm:text-left">
                    <Link
                      href={`/product/${item.slug}`}
                      className="font-semibold hover:text-primary line-clamp-2"
                    >
                      {item.name}
                    </Link>
                    <p className="text-muted-foreground">{formatCurrency(item.price)} each</p>
                    <p className="text-xs text-muted-foreground">
                      Min. order qty: {item.minQuantity}
                    </p>
                  </div>

                  <div className="flex items-center gap-2" aria-label={`Quantity for ${item.name}`}>
                    <div className="flex items-center border rounded-md">
                      <button
                        className="p-2 hover:bg-muted rounded-l-md disabled:opacity-40"
                        onClick={() => updateQuantity(item.id, item.qty - 1)}
                        disabled={item.qty <= item.minQuantity}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" aria-hidden />
                      </button>
                      <span className="px-3 text-sm font-medium tabular-nums" aria-live="polite">
                        {item.qty}
                      </span>
                      <button
                        className="p-2 hover:bg-muted rounded-r-md"
                        onClick={() => updateQuantity(item.id, item.qty + 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                  </div>

                  <p className="font-bold w-24 text-right">{formatCurrency(item.price * item.qty)}</p>

                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => removeProduct(item.id)}
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>

            <div className="flex justify-between items-center mt-4">
              <Button variant="ghost" onClick={reset} className="text-muted-foreground">
                <Trash2 className="mr-2 h-4 w-4" aria-hidden /> Clear cart
              </Button>
              <Button asChild variant="outline">
                <Link href="/product">Continue Shopping</Link>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-muted/50 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="flex justify-between mb-2">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Shipping</span>
                <span>{shipping === 0 ? "Free" : formatCurrency(shipping)}</span>
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
              {subtotal < 1000 && (
                <p className="text-xs text-muted-foreground mt-3">
                  Add {formatCurrency(1000 - subtotal)} more for free shipping.
                </p>
              )}
              <Button asChild className="w-full mt-6" size="lg">
                <Link href="/checkout">Proceed to Checkout</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
