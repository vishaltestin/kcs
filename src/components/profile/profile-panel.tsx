import type { ComponentType, ReactNode } from "react";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Shared chrome for every panel in the account area: a ringed card with an
 * icon-badge header, optional aside slot (badges/actions), and a footer bar
 * that hosts the primary action so all forms feel identical.
 */
export function ProfilePanel({
  icon: Icon,
  title,
  description,
  aside,
  footer,
  className,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  aside?: ReactNode;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/[0.07]", className)}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/[0.08] text-primary">
            <Icon className="size-[18px]" />
          </span>
          <div>
            <h2 className="text-[15px] font-bold tracking-tight">{title}</h2>
            {description && <p className="text-[12.5px] text-muted-foreground">{description}</p>}
          </div>
        </div>
        {aside}
      </header>

      <div className="px-5 py-5 sm:px-6">{children}</div>

      {footer && (
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t bg-surface/70 px-5 py-3.5 sm:px-6">
          {footer}
        </footer>
      )}
    </section>
  );
}

/** Primary submit for profile forms — label swaps while pending. */
export function SaveButton({
  pending,
  children,
  pendingLabel = "Saving…",
}: {
  pending: boolean;
  children: ReactNode;
  pendingLabel?: string;
}) {
  return (
    <Button type="submit" disabled={pending} aria-busy={pending} className="min-w-40">
      {pending ? (
        <>
          <Loader2 className="animate-spin" aria-hidden />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

/** Small helper text shown on the left of the footer. */
export function FooterHint({ children }: { children: ReactNode }) {
  return <p className="text-[12.5px] text-muted-foreground">{children}</p>;
}
