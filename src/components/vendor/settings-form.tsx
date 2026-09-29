"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { ImagePicker } from "@/components/admin/image-picker";
import { vendorUpdateProfileAction } from "@/actions/vendor/profile";
import { vendorProfileSchema } from "@/lib/validations/admin";
import type { z } from "zod";

export type VendorSettingsValues = z.infer<typeof vendorProfileSchema>;

export interface VendorSettingsData {
  name: string;
  email: string;
  phone: string | null;
  gstin: string | null;
  legalName: string | null;
  stateCode: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  logo: string | null;
  description: string | null;
}

export function VendorSettingsForm({ vendor }: { vendor: VendorSettingsData }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<VendorSettingsValues>({
    resolver: zodResolver(vendorProfileSchema),
    defaultValues: {
      name: vendor.name,
      phone: vendor.phone ?? "",
      address: vendor.address ?? "",
      city: vendor.city ?? "",
      state: vendor.state ?? "",
      pincode: vendor.pincode ?? "",
      logo: vendor.logo ?? "",
      description: vendor.description ?? "",
    },
  });

  const logoValue = form.watch("logo");

  const onSubmit = async (values: VendorSettingsValues) => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.set("name", values.name);
    formData.set("phone", values.phone ?? "");
    formData.set("address", values.address ?? "");
    formData.set("city", values.city ?? "");
    formData.set("state", values.state ?? "");
    formData.set("pincode", values.pincode ?? "");
    formData.set("logo", values.logo ?? "");
    formData.set("description", values.description ?? "");

    const result = await vendorUpdateProfileAction(null, formData);
    setIsSubmitting(false);

    if (result.ok) {
      toast.success(result.message ?? "Saved!");
    } else {
      toast.error(result.message);
      if (result.fieldErrors) {
        for (const [key, messages] of Object.entries(result.fieldErrors)) {
          if (messages?.length) {
            form.setError(key as keyof VendorSettingsValues, { message: messages[0] });
          }
        }
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid items-start gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Public profile</CardTitle>
            <CardDescription>
              Shown on your seller page and next to your products (&ldquo;Sold by &hellip;&rdquo;).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display name *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} placeholder="98XXXXXXXX" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>About your business</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="sm:col-span-2">
              <ImagePicker
                value={logoValue ?? ""}
                onChange={(path) => form.setValue("logo", path, { shouldValidate: false })}
                label="Logo"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact address</CardTitle>
            <CardDescription>Used for marketplace correspondence.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="city"
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
              name="state"
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
              name="pincode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PIN code</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} inputMode="numeric" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance (managed by KCS G-Mart)</CardTitle>
            <CardDescription>
              These details affect invoicing and GST — contact the marketplace team to change them.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Legal name</p>
              <p className="mt-1 font-medium">{vendor.legalName ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">GSTIN</p>
              <p className="mt-1 font-mono font-medium">{vendor.gstin ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                GST state code
              </p>
              <p className="mt-1 font-mono font-medium">{vendor.stateCode}</p>
            </div>
          </CardContent>
        </Card>
        </div>

        <div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
            Save changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
