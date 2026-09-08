"use client";

import { startTransition, useActionState, useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { submitBulkEnquiryAction } from "@/actions/enquiries";
import { bulkEnquirySchema, type BulkEnquiryInput } from "@/lib/validations/shop";
import type { ActionResult } from "@/types";

export function BulkEnquiryForm({
  productId,
  productName,
  onDone,
}: {
  productId?: string;
  productName?: string;
  onDone?: () => void;
}) {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    submitBulkEnquiryAction,
    null
  );

  const form = useForm<BulkEnquiryInput>({
    resolver: zodResolver(bulkEnquirySchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      companyName: "",
      quantity: undefined,
      message: "",
    },
  });

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Enquiry submitted!");
      form.reset();
      onDone?.();
    } else {
      toast.error(state.message);
    }
  }, [state, form, onDone]);

  const onSubmit = (values: BulkEnquiryInput) => {
    const formData = new FormData();
    formData.set("name", values.name);
    formData.set("email", values.email);
    formData.set("phone", values.phone);
    formData.set("companyName", values.companyName ?? "");
    formData.set("quantity", values.quantity ? String(values.quantity) : "");
    formData.set("message", values.message);
    if (productId) formData.set("productId", productId);
    if (productName) formData.set("productName", productName);
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" aria-busy={isPending}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name *</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work email *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@company.com" {...field} />
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
                <FormLabel>Phone *</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="9876543210" {...field} />
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
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <Input placeholder="Company name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Approx. quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    placeholder="e.g. 250"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Requirement details *</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="Tell us about your gifting requirement, budget, timeline, branding needs…"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" size="lg" disabled={isPending} className="w-full sm:w-auto sm:min-w-44">
          {isPending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden /> Sending…
            </>
          ) : (
            "Submit Enquiry"
          )}
        </Button>
      </form>
    </Form>
  );
}
