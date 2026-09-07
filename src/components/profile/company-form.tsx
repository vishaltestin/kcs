"use client";

import { useActionState, useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { updateCompanyAction } from "@/actions/profile";
import { updateCompanySchema, type UpdateCompanyInput } from "@/lib/validations/auth";
import type { ActionResult } from "@/types";

export function CompanyForm({
  user,
}: {
  user: { companyName: string | null; gstNo: string | null; panNo: string | null };
}) {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    updateCompanyAction,
    null
  );

  const form = useForm<UpdateCompanyInput>({
    resolver: zodResolver(updateCompanySchema),
    defaultValues: {
      companyName: user.companyName ?? "",
      gstNo: user.gstNo ?? "",
      panNo: user.panNo ?? "",
    },
  });

  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success(state.message ?? "Saved!");
    else toast.error(state.message);
  }, [state]);

  const onSubmit = (values: UpdateCompanyInput) => {
    const formData = new FormData();
    formData.set("companyName", values.companyName ?? "");
    formData.set("gstNo", values.gstNo ?? "");
    formData.set("panNo", values.panNo ?? "");
    formAction(formData);
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Company Details</CardTitle>
        <CardDescription>
          Used for GST invoicing on your corporate orders. Optional, but recommended.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Pvt. Ltd." {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gstNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST number</FormLabel>
                    <FormControl>
                      <Input placeholder="07ABCDE1234F1Z5" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="panNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PAN number</FormLabel>
                    <FormControl>
                      <Input placeholder="ABCDE1234F" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              Save company details
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
