"use client";

import { startTransition, useActionState, useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitContactMessageAction } from "@/actions/enquiries";
import { contactMessageSchema, type ContactMessageInput } from "@/lib/validations/shop";
import type { ActionResult } from "@/types";

export function ContactForm() {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    submitContactMessageAction,
    null
  );

  const form = useForm<ContactMessageInput>({
    resolver: zodResolver(contactMessageSchema),
    defaultValues: { name: "", email: "", phone: "", subject: "", message: "" },
  });

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Message sent!");
      form.reset();
    } else {
      toast.error(state.message);
    }
  }, [state, form]);

  const onSubmit = (values: ContactMessageInput) => {
    const formData = new FormData();
    formData.set("name", values.name);
    formData.set("email", values.email);
    formData.set("phone", values.phone ?? "");
    formData.set("subject", values.subject ?? "");
    formData.set("message", values.message);
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5" noValidate aria-busy={isPending}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="contact-name">Name *</Label>
          <Input id="contact-name" placeholder="Your name" autoComplete="name" {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-xs font-medium text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="contact-email">Email *</Label>
          <Input id="contact-email" type="email" placeholder="you@company.com" autoComplete="email" {...form.register("email")} />
          {form.formState.errors.email && (
            <p className="text-xs font-medium text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="contact-phone">Phone</Label>
          <Input id="contact-phone" type="tel" placeholder="9876543210" autoComplete="tel" {...form.register("phone")} />
          {form.formState.errors.phone && (
            <p className="text-xs font-medium text-destructive">{form.formState.errors.phone.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="contact-subject">Subject</Label>
          <Input id="contact-subject" placeholder="e.g. Diwali hampers for 200 employees" {...form.register("subject")} />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="contact-message">Message *</Label>
        <Textarea
          id="contact-message"
          placeholder="Tell us about your requirement — occasion, quantity, budget per piece and timeline…"
          className="min-h-[150px]"
          {...form.register("message")}
        />
        {form.formState.errors.message && (
          <p className="text-xs font-medium text-destructive">{form.formState.errors.message.message}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="submit" size="lg" disabled={isPending} className="min-w-40">
          {isPending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden /> Sending…
            </>
          ) : (
            <>
              Send message <Send aria-hidden />
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">We reply within one business day.</p>
      </div>
    </form>
  );
}
