import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/guards";
import { getOrderByNumber } from "@/lib/queries/orders";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Order Confirmed",
};

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const user = await requireUser(`/order-success/${orderNumber}`);
  const order = await getOrderByNumber(orderNumber, user.id);
  if (!order) notFound();

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="text-center mb-10">
        <CheckCircle2 className="mx-auto h-16 w-16 text-green-600 mb-4" aria-hidden />
        <h1 className="text-3xl font-bold">Thank you for your order!</h1>
        <p className="text-muted-foreground mt-2">
          Order <strong>{order.orderNumber}</strong> placed on {formatDate(order.createdAt)}. Our
          team will reach out shortly to confirm details and delivery.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" aria-hidden /> Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="divide-y">
            {order.items.map((item) => (
              <li key={item.id} className="py-3 flex justify-between gap-4">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} × {formatCurrency(item.unitPrice)}
                  </p>
                </div>
                <p className="font-semibold">{formatCurrency(item.lineTotal)}</p>
              </li>
            ))}
          </ul>

          <div className="space-y-1 text-sm border-t pt-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{Number(order.shipping) === 0 ? "Free" : formatCurrency(order.shipping)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base pt-2">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>

          <div className="text-sm text-muted-foreground border-t pt-4">
            <p>
              <strong>Shipping to:</strong> {order.shippingAddress}, {order.shippingCity},{" "}
              {order.shippingState} — {order.shippingPincode}
            </p>
            <p className="mt-1">
              <strong>Status:</strong> {order.status}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-4 mt-8">
        <Button asChild variant="outline">
          <Link href="/product">Continue Shopping</Link>
        </Button>
        <Button asChild>
          <Link href="/profile">View My Orders</Link>
        </Button>
      </div>
    </div>
  );
}
