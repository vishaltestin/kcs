"use client";

import { startTransition, useActionState, useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
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
import { changePasswordAction } from "@/actions/profile";
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validations/auth";
import { FooterHint, ProfilePanel, SaveButton } from "./profile-panel";
import type { ActionResult } from "@/types";

export function PasswordForm() {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    changePasswordAction,
    null
  );
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Password updated!");
      form.reset();
    } else {
      toast.error(state.message);
    }
  }, [state, form]);

  const onSubmit = (values: ChangePasswordInput) => {
    const formData = new FormData();
    formData.set("currentPassword", values.currentPassword);
    formData.set("newPassword", values.newPassword);
    formData.set("confirmPassword", values.confirmPassword);
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} aria-busy={isPending}>
        <ProfilePanel
          icon={ShieldCheck}
          title="Change password"
          description="Use at least 8 characters with a mix of letters and numbers."
          footer={
            <>
              <FooterHint>You&apos;ll stay signed in on this device.</FooterHint>
              <SaveButton pending={isPending} pendingLabel="Updating…">
                Update password
              </SaveButton>
            </>
          }
        >
          <fieldset disabled={isPending} className="max-w-xl space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        className="pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm new password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
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
