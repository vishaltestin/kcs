import { TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Demo-store notice.
 *
 * This deployment is a demonstration: nothing in the catalogue is for sale and
 * no order should be placed. The strip sits above the navbar on every
 * storefront page, so nobody can add to cart without having seen it, and it is
 * deliberately **not** dismissible — a warning about not spending money should
 * not be one tap away from gone.
 *
 * It is rendered by the shop layout, so admin and vendor dashboards are
 * unaffected.
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
