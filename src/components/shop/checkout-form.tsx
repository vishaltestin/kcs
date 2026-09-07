"use client";

import { useActionState, useEffect, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ChevronDown, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { placeOrderAction } from "@/actions/orders";
import { checkoutFormSchema, type CheckoutFormValues } from "@/lib/validations/shop";
import { useCartStore } from "@/store/cart";
import { formatCurrency } from "@/lib/utils";
import type { ActionResult } from "@/types";

type CheckoutDefaults = Pick<
  CheckoutFormValues,
  | "customerName"
  | "customerEmail"
  | "customerPhone"
  | "companyName"
  | "gstNo"
  | "billingAddress"
  | "billingCity"
  | "billingState"
  | "billingPincode"
  | "shippingAddress"
  | "shippingCity"
  | "shippingState"
  | "shippingPincode"
>;

export function CheckoutForm({ defaults }: { defaults: CheckoutDefaults }) {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const resetCart = useCartStore((state) => state.reset);

  const [sameAsBilling, setSameAsBilling] = useState(
    !defaults.shippingAddress || defaults.shippingAddress === defaults.billingAddress
  );

  const [state, formAction, isPending] = useActionState<ActionResult<{ orderNumber: string }> | null, FormData>(
    placeOrderAction,
    null
  );

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      ...defaults,
      sameAsBilling,
      notes: "",
    },
  });

  useEffect(() => {
    if (!state) return;
    if (state.ok && state.data) {
      resetCart();
      toast.success(state.message ?? "Order placed!");
      router.push(`/order-success/${state.data.orderNumber}`);
    } else if (!state.ok) {
      toast.error(state.message);
    }
  }, [state, resetCart, router]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = subtotal >= 1000 || subtotal === 0 ? 0 : 100;
  const total = subtotal + shipping;

  const onSubmit = (values: CheckoutFormValues) => {
    const formData = new FormData();
    formData.set("customerName", values.customerName);
    formData.set("customerEmail", values.customerEmail);
    formData.set("customerPhone", values.customerPhone);
    formData.set("companyName", values.companyName ?? "");
    formData.set("gstNo", values.gstNo ?? "");
    formData.set("billingAddress", values.billingAddress);
    formData.set("billingCity", values.billingCity);
    formData.set("billingState", values.billingState);
    formData.set("billingPincode", values.billingPincode);
    formData.set("sameAsBilling", String(sameAsBilling));
    formData.set(
      "shippingAddress",
      sameAsBilling ? values.billingAddress : values.shippingAddress ?? ""
    );
    formData.set("shippingCity", sameAsBilling ? values.billingCity : values.shippingCity ?? "");
    formData.set("shippingState", sameAsBilling ? values.billingState : values.shippingState ?? "");
    formData.set("shippingPincode", sameAsBilling ? values.billingPincode : values.shippingPincode ?? "");
    formData.set("notes", values.notes ?? "");
    formData.set(
      "items",
      JSON.stringify(items.map((item) => ({ productId: item.id, quantity: item.qty })))
    );
    formAction(formData);
  };

  if (items.length === 0 && !state?.ok) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">Add products to your cart before checking out.</p>
        <Button asChild>
          <Link href="/product">Browse Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Contact &amp; Company Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone *</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company name</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gstNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST number (for invoicing)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Billing */}
          <Card>
            <CardHeader>
              <CardTitle>Billing Address</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="billingAddress"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Street address *</FormLabel>
                    <FormControl>
                      <Input placeholder="Office address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="billingCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="billingState"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="billingPincode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PIN code *</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" maxLength={6} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Shipping */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Shipping Address</CardTitle>
              <label className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                <Checkbox
                  checked={sameAsBilling}
                  onCheckedChange={(checked) => setSameAsBilling(checked === true)}
                  aria-label="Shipping address same as billing"
                />
                Same as billing
              </label>
            </CardHeader>
            {!sameAsBilling && (
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="shippingAddress"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Street address</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shippingCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shippingState"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shippingPincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PIN code</FormLabel>
                      <FormControl>
                        <Input inputMode="numeric" maxLength={6} {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            )}
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Order Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Branding requirements, delivery timeline, packaging preferences…"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-muted/50 p-6 rounded-lg shadow sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <ul className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 items-center">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={44}
                    height={44}
                    className="rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.qty} × {formatCurrency(item.price)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold whitespace-nowrap">
                    {formatCurrency(item.price * item.qty)}
                  </p>
                </li>
              ))}
            </ul>

            <Separator className="my-4" />

            <div className="flex justify-between mb-2 text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between mb-2 text-sm">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : formatCurrency(shipping)}</span>
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>

            <Button type="submit" className="w-full mt-6" size="lg" disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Lock className="mr-2 h-4 w-4" aria-hidden />
              )}
              Place Order
            </Button>

            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <ChevronDown className="h-3 w-3" aria-hidden />
              Our team confirms every corporate order by phone/email before dispatch.
            </p>
          </div>
        </div>
      </form>
    </Form>
  );
}
