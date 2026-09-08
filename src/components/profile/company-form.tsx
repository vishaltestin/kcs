"use client";

import { startTransition, useActionState, useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Building2, ReceiptText } from "lucide-react";
import { toast } from "sonner";

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
import { FooterHint, ProfilePanel, SaveButton } from "./profile-panel";
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
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} aria-busy={isPending}>
        <ProfilePanel
          icon={Building2}
          title="Company details"
          description="Used for GST invoicing on corporate orders. Optional, but recommended."
          aside={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-[11.5px] font-bold text-success">
              <ReceiptText className="size-3.5" aria-hidden /> GST invoice ready
            </span>
          }
          footer={
            <>
              <FooterHint>We validate GST numbers before dispatch.</FooterHint>
              <SaveButton pending={isPending}>Save company details</SaveButton>
            </>
          }
        >
          <fieldset disabled={isPending} className="space-y-4">
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="gstNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST number</FormLabel>
                    <FormControl>
                      <Input placeholder="07ABCDE1234F1Z5" className="font-mono uppercase tracking-wide" {...field} value={field.value ?? ""} />
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
                      <Input placeholder="ABCDE1234F" className="font-mono uppercase tracking-wide" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

          </fieldset>
        </ProfilePanel>
      </form>
    </Form>
  );
}
