import { Check, Circle, Loader2, ShieldCheck } from "lucide-react";

/**
 * Shown while the return page verifies the payment with Cashfree (up to
 * ~10s when the gateway lags). A calm, explicit status card — not a generic
 * skeleton — so customers know the payment is being confirmed and wait
 * instead of closing the tab.
 */
export default function CheckoutReturnLoading() {
  return (
    <div
      className="container flex min-h-[62vh] items-center justify-center py-16"
      aria-busy="true"
      aria-label="Verifying your payment"
    >
      <div className="w-full max-w-md rounded-2xl border border-foreground/[0.08] bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10">
          <Loader2 className="size-7 animate-spin text-primary" aria-hidden />
        </div>
        <h1 className="mt-5 text-xl font-semibold tracking-tight">Verifying your payment…</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          We&apos;re confirming your payment with the gateway. This usually takes just a few seconds.
        </p>

        <ol className="mt-6 space-y-3 text-left text-sm">
          <li className="flex items-center gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
              <Check className="size-3.5 text-emerald-600" aria-hidden />
            </span>
            <span className="text-muted-foreground">Returned from secure checkout</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="size-3.5 animate-spin text-primary" aria-hidden />
            </span>
            <span className="font-medium">Confirming payment with Cashfree</span>
          </li>
          <li className="flex items-center gap-3 opacity-60">
            <Circle className="ml-1 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="text-muted-foreground">Preparing your order confirmation</span>
          </li>
        </ol>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="size-4" aria-hidden />
          Please don&apos;t close or refresh this tab.
        </p>
      </div>
    </div>
  );
}
