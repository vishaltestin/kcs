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
    <section className={cn("", className)}>
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-foreground/[0.12] pb-4">
        <div>
          <h2 className="display flex items-center gap-2 text-[1.5rem]">
            {title}
            <Icon className="size-4 text-foreground/40" />
          </h2>
          {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
        </div>
        {aside}
      </header>

      <div className="py-6">{children}</div>

      {footer && (
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-foreground/[0.12] pt-4">
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
