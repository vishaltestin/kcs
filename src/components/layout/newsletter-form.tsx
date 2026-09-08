"use client";

import { useActionState, useEffect, useRef } from "react";

import { ArrowRight, CheckCircle2, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { subscribeNewsletterAction } from "@/actions/enquiries";
import type { ActionResult } from "@/types";

export function NewsletterForm() {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    subscribeNewsletterAction,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Subscribed!");
      formRef.current?.reset();
    } else {
      toast.error(state.message);
    }
  }, [state]);

  if (state?.ok) {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-success/[0.08] px-4 py-3 text-sm font-medium text-success" role="status">
        <CheckCircle2 className="size-4" aria-hidden />
        {state.message ?? "You're on the list — see you in the next issue."}
      </p>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex h-12 w-full max-w-md items-center gap-1 rounded-xl border bg-background p-1 pl-3 transition-shadow focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10"
      aria-busy={isPending}
    >
      <Mail className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        required
        placeholder="Your work email"
        className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground/80"
        aria-invalid={state && !state.ok ? true : undefined}
      />
      <Button type="submit" disabled={isPending} className="h-10 shrink-0 rounded-lg px-4">
        {isPending ? (
          <Loader2 className="animate-spin" aria-hidden />
        ) : (
          <>
            <span className="hidden sm:inline">Subscribe</span>
            <ArrowRight aria-hidden />
          </>
        )}
        <span className="sr-only">Subscribe</span>
      </Button>
    </form>
  );
}
