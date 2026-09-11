"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Loader2,
  Lock,
  MapPin,
  MessageSquareText,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { EmptyState } from "@/components/shared/empty-state";
import { placeOrderAction } from "@/actions/orders";
import { useShippingEstimate } from "@/components/shop/use-shipping-estimate";
import { formatGrams } from "@/lib/shipping";
import { INDIAN_STATES } from "@/lib/india";
import { checkoutFormSchema, type CheckoutFormValues } from "@/lib/validations/shop";
import { useCartStore } from "@/store/cart";
import { cn, formatCurrency } from "@/lib/utils";
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

  // Keeps the button in its "busy" state from the moment the order succeeds
  // until the success page has actually taken over — so the user only ever
  // sees the button loading, never a blank/skeleton page in between.
  const [isRedirecting, setIsRedirecting] = useState(false);
  const handledState = useRef<typeof state>(null);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      ...defaults,
      sameAsBilling,
      notes: "",
    },
  });

  useEffect(() => {
    if (!state || handledState.current === state) return;
    handledState.current = state;

    // Defer to a microtask so the state update happens outside the effect
    // body (avoids a cascading synchronous re-render); the button stays busy
    // through the redirect either way.
    const id = window.setTimeout(() => {
      if (state.ok && state.data) {
        setIsRedirecting(true);
        resetCart();
        toast.success(state.message ?? "Order placed!");
        router.push(`/order-success/${state.data.orderNumber}`);
      } else if (!state.ok) {
        toast.error(state.message);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [state, resetCart, router]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  // Live weight/zone-based shipping for the destination state being typed.
  const billingState = form.watch("billingState") ?? "";
  const shippingState = form.watch("shippingState") ?? "";
  const destinationState = sameAsBilling ? billingState : shippingState || billingState;
  const { estimate, loading: shippingLoading } = useShippingEstimate(items, destinationState, subtotal);
  const shipping = estimate?.amount ?? 0;
  const total = subtotal + shipping;
  const pieces = items.reduce((sum, item) => sum + item.qty, 0);
  const busy = isPending || isRedirecting;

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
      JSON.stringify(
        items.map((item) => ({ productId: item.productId, variantId: item.variantId, quantity: item.qty }))
      )
    );
    // Dispatching inside a transition keeps `isPending` accurate and stops
    // React from treating the action as a blocking (full-page) update.
    startTransition(() => {
      formAction(formData);
    });
  };

  if (items.length === 0 && !state?.ok && !isRedirecting) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your cart is empty"
        description="Add products to your cart before checking out."
        action={
          <Button size="lg" asChild>
            <Link href="/product">
              Browse Products <ArrowRight aria-hidden />
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start"
        aria-busy={busy}
      >
        <datalist id="kcs-states">
          {INDIAN_STATES.map((st) => (
            <option key={st} value={st} />
          ))}
        </datalist>
        <fieldset disabled={busy} className="min-w-0 space-y-5 disabled:opacity-90">
          {/* Contact */}
          <Section step={1} icon={Building2} title="Contact & Company" hint="Who should we reach for confirmation and invoicing?">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name *</FormLabel>
                    <FormControl>
                      <Input autoComplete="name" {...field} />
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
                      <Input type="email" autoComplete="email" {...field} />
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
                      <Input type="tel" autoComplete="tel" {...field} />
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
                      <Input autoComplete="organization" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gstNo"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>GST number (for invoicing)</FormLabel>
                    <FormControl>
                      <Input placeholder="22AAAAA0000A1Z5" className="uppercase" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Section>

          {/* Billing */}
          <Section step={2} icon={MapPin} title="Billing Address" hint="Appears on your GST invoice.">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="billingAddress"
                render={({ field }) => (
                  <FormItem className="md:col-span-3">
                    <FormLabel>Street address *</FormLabel>
                    <FormControl>
                      <Input placeholder="Office address" autoComplete="street-address" {...field} />
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
                      <Input autoComplete="address-level2" {...field} />
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
                      <Input autoComplete="address-level1" list="kcs-states" placeholder="e.g. Delhi" {...field} />
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
                      <Input inputMode="numeric" maxLength={6} autoComplete="postal-code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Section>

          {/* Shipping */}
          <Section
            step={3}
            icon={Truck}
            title="Shipping Address"
            hint="Where the gifts get delivered."
            aside={
              <label className="flex cursor-pointer items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-[13px] font-medium transition-colors hover:border-primary/40">
                <Checkbox
                  checked={sameAsBilling}
                  onCheckedChange={(checked) => setSameAsBilling(checked === true)}
                  aria-label="Shipping address same as billing"
                />
                Same as billing
              </label>
            }
          >
            {sameAsBilling ? (
              <p className="flex items-center gap-2 rounded-xl bg-success/[0.08] px-4 py-3 text-sm text-foreground/80">
                <CheckCircle2 className="size-4 text-success" aria-hidden />
                We&apos;ll ship to your billing address.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="shippingAddress"
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
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
                        <Input list="kcs-states" placeholder="e.g. Maharashtra" {...field} value={field.value ?? ""} />
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
              </div>
            )}
          </Section>

          {/* Notes */}
          <Section step={4} icon={MessageSquareText} title="Order Notes" hint="Optional — branding, timelines, packaging.">
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
          </Section>
        </fieldset>

        {/* Summary */}
        <aside className="lg:sticky lg:top-20">
          <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/[0.07] shadow-[0_24px_48px_-28px_rgb(0_0_0/0.35)]">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-base font-extrabold tracking-tight">Order Summary</h2>
              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                {items.length} {items.length === 1 ? "item" : "items"} · {pieces} pcs
              </span>
            </div>

            <ul className="scrollbar-thin max-h-72 space-y-3 overflow-y-auto px-5 py-4">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/5">
                    <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                    <span className="absolute -top-0.5 -right-0.5 rounded-full bg-foreground px-1.5 text-[10px] font-bold text-background">
                      {item.qty}
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-[13px] font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.variantLabel && <span className="font-semibold text-foreground">{item.variantLabel} · </span>}
                      {item.qty} × {formatCurrency(item.price)}
                    </p>
                  </div>
                  <p className="text-[13px] font-bold tabular-nums whitespace-nowrap">
                    {formatCurrency(item.price * item.qty)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="space-y-2 border-t bg-surface px-5 py-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-medium text-foreground tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span className={cn("font-medium tabular-nums", estimate?.free ? "text-success" : "text-foreground")}>
                  {shippingLoading ? (
                    <Loader2 className="size-4 animate-spin" aria-label="Calculating shipping" />
                  ) : !estimate ? (
                    "—"
                  ) : estimate.free ? (
                    "Free"
                  ) : (
                    formatCurrency(estimate.amount)
                  )}
                </span>
              </div>
              {estimate && (
                <p className="-mt-1 text-[11px] text-muted-foreground">
                  {estimate.free && estimate.reason === "free-threshold"
                    ? `Free shipping on orders above ${formatCurrency(estimate.freeShippingThreshold)}`
                    : `${destinationState.trim() ? estimate.zoneName : "Enter your state for the exact rate"}${estimate.etaDays && destinationState.trim() ? ` · ${estimate.etaDays} working days` : ""}${estimate.chargeableWeight > 0 ? ` · ${formatGrams(estimate.chargeableWeight)}` : ""}`}
                </p>
              )}
              <div className="flex items-baseline justify-between border-t pt-3">
                <span className="text-base font-extrabold tracking-tight">Total</span>
                <span className="text-xl font-extrabold tracking-tight tabular-nums">{formatCurrency(total)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Inclusive of GST · tax invoice generated with your order{form.watch("gstNo") ? " (B2B, with your GSTIN)" : ""}
              </p>
            </div>

            <div className="px-5 pt-4 pb-5">
              <Button type="submit" size="xl" className="w-full" disabled={busy} aria-live="polite">
                {busy ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden />
                    {isRedirecting ? "Order placed — opening confirmation…" : "Placing your order…"}
                  </>
                ) : (
                  <>
                    <Lock aria-hidden /> Place Order <ArrowRight aria-hidden />
                  </>
                )}
              </Button>

              <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
                  Our team confirms every corporate order by phone/email before dispatch.
                </li>
                <li className="flex items-start gap-2">
                  <Truck className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
                  Shipping is calculated from packed weight and destination
                  {estimate ? `; free above ${formatCurrency(estimate.freeShippingThreshold)}.` : "."}
                </li>
              </ul>

              <Link
                href="/cart"
                className="mt-4 block text-center text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
              >
                Edit cart
              </Link>
            </div>
          </div>
        </aside>
      </form>
    </Form>
  );
}

/* -------------------------------------------------------------------------- */

function Section({
  step,
  icon: Icon,
  title,
  hint,
  aside,
  children,
}: {
  step: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-card ring-1 ring-foreground/[0.07]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="relative grid size-10 place-items-center rounded-xl bg-primary/[0.08] text-primary">
            <Icon className="size-[18px]" />
            <span className="absolute -top-1.5 -left-1.5 grid size-5 place-items-center rounded-full bg-foreground text-[10px] font-bold text-background">
              {step}
            </span>
          </span>
          <div>
            <h2 className="text-[15px] font-extrabold tracking-tight">{title}</h2>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          </div>
        </div>
        {aside}
      </header>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}
