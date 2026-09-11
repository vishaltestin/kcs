"use client";

import { startTransition, useActionState, useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { MapPin, Truck } from "lucide-react";
import { toast } from "sonner";

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
import { updateAddressAction } from "@/actions/profile";
import { updateAddressSchema, type UpdateAddressInput } from "@/lib/validations/auth";
import { FooterHint, ProfilePanel, SaveButton } from "./profile-panel";
import type { ActionResult } from "@/types";

type AddressUser = {
  billingAddress: string | null;
  billingCity: string | null;
  billingState: string | null;
  billingPincode: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPincode: string | null;
};

export function AddressForm({ user }: { user: AddressUser }) {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    updateAddressAction,
    null
  );

  const sameShipping =
    !user.shippingAddress || user.shippingAddress === user.billingAddress;

  const [sameAsBilling, setSameAsBilling] = useState(sameShipping);

  const form = useForm<UpdateAddressInput>({
    resolver: zodResolver(updateAddressSchema),
    defaultValues: {
      billingAddress: user.billingAddress ?? "",
      billingCity: user.billingCity ?? "",
      billingState: user.billingState ?? "",
      billingPincode: user.billingPincode ?? "",
      sameAsBilling,
      shippingAddress: user.shippingAddress ?? "",
      shippingCity: user.shippingCity ?? "",
      shippingState: user.shippingState ?? "",
      shippingPincode: user.shippingPincode ?? "",
    },
  });

  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success(state.message ?? "Saved!");
    else toast.error(state.message);
  }, [state]);

  const onSubmit = (values: UpdateAddressInput) => {
    const formData = new FormData();
    formData.set("billingAddress", values.billingAddress);
    formData.set("billingCity", values.billingCity);
    formData.set("billingState", values.billingState);
    formData.set("billingPincode", values.billingPincode);
    formData.set("sameAsBilling", String(sameAsBilling));
    formData.set("shippingAddress", values.shippingAddress ?? "");
    formData.set("shippingCity", values.shippingCity ?? "");
    formData.set("shippingState", values.shippingState ?? "");
    formData.set("shippingPincode", values.shippingPincode ?? "");
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} aria-busy={isPending}>
        <ProfilePanel
          icon={MapPin}
          title="Addresses"
          description="Saved addresses are pre-filled at checkout for faster ordering."
          footer={
            <>
              <FooterHint>Shipping is calculated per zone and weight at checkout.</FooterHint>
              <SaveButton pending={isPending}>Save addresses</SaveButton>
            </>
          }
        >
          <fieldset disabled={isPending} className="space-y-6">
            <div className="space-y-4">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                <MapPin className="size-3.5 text-primary" aria-hidden /> Billing address
              </p>
              <FormField
                control={form.control}
                name="billingAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street address</FormLabel>
                    <FormControl>
                      <Input placeholder="Office address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="billingCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
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
                      <FormLabel>State</FormLabel>
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
                      <FormLabel>PIN code</FormLabel>
                      <FormControl>
                        <Input inputMode="numeric" maxLength={6} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed bg-surface/60 px-4 py-3 text-sm font-medium transition-colors hover:bg-surface">
              <Checkbox
                checked={sameAsBilling}
                onCheckedChange={(checked) => setSameAsBilling(checked === true)}
                aria-label="Shipping address same as billing"
              />
              <span className="flex items-center gap-2">
                <Truck className="size-4 text-muted-foreground" aria-hidden />
                Shipping address is the same as billing
              </span>
            </label>

            {!sameAsBilling && (
              <div className="space-y-4 animate-fade-up">
                <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  <Truck className="size-3.5 text-primary" aria-hidden /> Shipping address
                </p>
                <FormField
                  control={form.control}
                  name="shippingAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street address</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                </div>
              </div>
            )}
          </fieldset>
        </ProfilePanel>
      </form>
    </Form>
  );
}
