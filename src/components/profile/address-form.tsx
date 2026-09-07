"use client";

import { useActionState, useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    formAction(formData);
  };

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Addresses</CardTitle>
        <CardDescription>
          Saved addresses are pre-filled at checkout for faster ordering.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <fieldset className="space-y-4">
              <legend className="font-semibold text-sm mb-1">Billing address</legend>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            </fieldset>

            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <Checkbox
                checked={sameAsBilling}
                onCheckedChange={(checked) => setSameAsBilling(checked === true)}
                aria-label="Shipping address same as billing"
              />
              Shipping address is the same as billing
            </label>

            {!sameAsBilling && (
              <fieldset className="space-y-4">
                <legend className="font-semibold text-sm mb-1">Shipping address</legend>
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              </fieldset>
            )}

            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              Save addresses
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
