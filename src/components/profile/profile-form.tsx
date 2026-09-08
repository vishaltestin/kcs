"use client";

import { startTransition, useActionState, useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { UserRound } from "lucide-react";
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
import { updateProfileAction } from "@/actions/profile";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations/auth";
import { FooterHint, ProfilePanel, SaveButton } from "./profile-panel";
import type { ActionResult } from "@/types";

export function ProfileForm({
  user,
}: {
  user: { firstName: string; lastName: string; phone: string | null };
}) {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    updateProfileAction,
    null
  );

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? "",
    },
  });

  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success(state.message ?? "Saved!");
    else toast.error(state.message);
  }, [state]);

  const onSubmit = (values: UpdateProfileInput) => {
    const formData = new FormData();
    formData.set("firstName", values.firstName);
    formData.set("lastName", values.lastName);
    formData.set("phone", values.phone);
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} aria-busy={isPending}>
        <ProfilePanel
          icon={UserRound}
          title="Personal information"
          description="Your name and contact number as used on orders and invoices."
          footer={
            <>
              <FooterHint>Changes apply to future orders only.</FooterHint>
              <SaveButton pending={isPending}>Save changes</SaveButton>
            </>
          }
        >
          <fieldset disabled={isPending} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile number</FormLabel>
                  <FormControl>
                    <Input type="tel" inputMode="tel" placeholder="98765 43210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          </fieldset>
        </ProfilePanel>
      </form>
    </Form>
  );
}
