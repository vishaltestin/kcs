import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader, StatusBadge } from "@/components/admin/ui";
import { ActionSelect } from "@/components/admin/action-select";
import { getAdminOrderById } from "@/lib/queries/admin";
import { updateOrderStatusAction } from "@/actions/admin/engagements";
import { ORDER_STATUSES } from "@/lib/constants";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Order Details" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getAdminOrderById(id);
  if (!order) notFound();

  return (
    <div>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/orders">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden /> All orders
          </Link>
        </Button>
      </div>

      <PageHeader
        title={order.orderNumber}
        description={`Placed ${formatDateTime(order.createdAt)} · ${order.user?.email ?? order.customerEmail}`}
        actions={
          <ActionSelect
            value={order.status}
            options={ORDER_STATUSES}
            on_change={updateOrderStatusAction.bind(null, order.id)}
            ariaLabel="Order status"
          />
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
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

            <Separator className="my-4" />

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{Number(order.shipping) === 0 ? "Free" : formatCurrency(order.shipping)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Status <StatusBadge status={order.status} />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div>
                <p className="font-semibold">{order.customerName}</p>
                <p className="text-muted-foreground">{order.customerEmail}</p>
                <p className="text-muted-foreground">{order.customerPhone}</p>
              </div>
              {order.companyName && (
                <p className="text-muted-foreground">
                  Company: <strong className="text-foreground">{order.companyName}</strong>
                  {order.gstNo ? ` · GST ${order.gstNo}` : ""}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Addresses</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              <div>
                <p className="font-semibold mb-1">Billing</p>
                <p className="text-muted-foreground">
                  {order.billingAddress}, {order.billingCity}, {order.billingState} —{" "}
                  {order.billingPincode}
                </p>
              </div>
              <div>
                <p className="font-semibold mb-1">Shipping</p>
                <p className="text-muted-foreground">
                  {order.shippingAddress}, {order.shippingCity}, {order.shippingState} —{" "}
                  {order.shippingPincode}
                </p>
              </div>
            </CardContent>
          </Card>

          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Order Notes</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground whitespace-pre-line">
                {order.notes}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
