import { Loader2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Brief transition while the success page loads the confirmed order —
 * a celebratory status card instead of a page-shaped skeleton, since the
 * customer just paid and only waits a beat here.
 */
export default function OrderSuccessLoading() {
  return (
    <div
      className="container flex min-h-[62vh] items-center justify-center py-16"
      aria-busy="true"
      aria-label="Loading your order confirmation"
    >
      <div className="w-full max-w-md rounded-2xl border border-foreground/[0.08] bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/15">
          <Loader2 className="size-7 animate-spin text-emerald-600" aria-hidden />
        </div>
        <h1 className="mt-5 text-xl font-semibold tracking-tight">Payment successful!</h1>
        <p className="mt-2 text-sm text-muted-foreground">Putting together your order confirmation…</p>
        <div className="mt-6 space-y-2.5" aria-hidden>
          <Skeleton className="h-4 w-2/3 rounded-full mx-auto" />
          <Skeleton className="h-9 w-full rounded-xl" />
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
