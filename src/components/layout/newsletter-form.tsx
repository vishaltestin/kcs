"use client";

import { useActionState, useEffect } from "react";

import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeNewsletterAction } from "@/actions/enquiries";
import type { ActionResult } from "@/types";

export function NewsletterForm() {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    subscribeNewsletterAction,
    null
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Subscribed!");
    } else {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form action={formAction} className="flex w-full max-w-md items-center gap-2">
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <Input
        id="newsletter-email"
        name="email"
        type="email"
        required
        placeholder="Your email address"
        className="bg-background"
        aria-invalid={state && !state.ok ? true : undefined}
      />
      <Button type="submit" disabled={isPending} className="shrink-0">
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Send className="h-4 w-4" aria-hidden />
        )}
        <span className="sr-only">Subscribe</span>
      </Button>
    </form>
  );
}
