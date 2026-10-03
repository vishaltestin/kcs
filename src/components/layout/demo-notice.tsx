import { TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Demo-store notice — the single place the demo warning is shown.
 *
 * This deployment is a demonstration: nothing in the catalogue is for sale and
 * no order should be placed. The strip sits directly above the navbar on every
 * storefront page (rendered by the shop layout), so nobody can browse, add to
 * cart or reach checkout without having seen it, and it is deliberately
 * **not** dismissible — a warning about not spending money should not be one
 * tap away from gone.
 *
 * Keep it this way: the warning intentionally lives here and nowhere else.
 * There is no second copy on the product page, at checkout or on the
 * order-success page — do not re-add one.
 *
 * Admin and vendor dashboards are unaffected (they don't render the shop
 * layout).
 */
export function DemoNotice({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "relative isolate w-full border-b border-amber-300/70 bg-amber-50 text-amber-950",
        "dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100",
        className,
      )}
      aria-label="Demo store notice"
    >
      <p className="container flex items-center justify-center gap-2 px-4 py-2 text-center text-[12.5px] leading-snug font-medium">
        <TriangleAlert className="size-4 shrink-0" aria-hidden />
        <span>
          <strong className="font-bold">Demo store.</strong> Products shown here are for
          demonstration only — please <strong className="font-bold">do not purchase</strong>. No
          orders will be fulfilled.
        </span>
      </p>
    </aside>
  );
}
