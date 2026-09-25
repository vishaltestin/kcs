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
      <p className="flex items-center gap-2 rounded-xl bg-brand-teal/15 px-4 py-3 text-sm font-semibold text-brand-teal-light ring-1 ring-brand-teal/30" role="status">
        <CheckCircle2 className="size-4" aria-hidden />
        {state.message ?? "You're on the list — see you in the next issue."}
      </p>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex h-12 w-full items-center gap-1 rounded-full border border-white/15 bg-white/[0.07] p-1 pl-4 text-white transition-shadow focus-within:border-brand-teal/60 focus-within:ring-4 focus-within:ring-brand-teal/20"
      aria-busy={isPending}
    >
      <Mail className="size-4 shrink-0 text-brand-teal-light" aria-hidden />
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        required
        placeholder="Your work email"
        className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-sm text-white outline-none placeholder:text-white/45"
        aria-invalid={state && !state.ok ? true : undefined}
      />
      <Button
        type="submit"
        disabled={isPending}
        className="h-10 shrink-0 rounded-full bg-secondary px-4 font-bold text-secondary-foreground shadow-accent hover:bg-brand-magenta-strong"
      >
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
