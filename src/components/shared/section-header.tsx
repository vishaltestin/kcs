import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Section heading used across the storefront.
 *
 * Editorial layout: a full-width top rule with a short red accent, then an
 * tracked kicker and a display title on the left, with the
 * description and "View all" link set on the right-hand column — the way a
 * catalogue folio introduces a spread. The centred variant stacks the same
 * pieces in the middle for full-width panels.
 */
export function SectionHeader({
  title,
  eyebrow,
  description,
  viewMoreHref,
  viewMoreLabel = "View all",
  center = false,
  tone = "light",
  className,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  viewMoreHref?: string;
  viewMoreLabel?: string;
  center?: boolean;
  tone?: "light" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";

  if (center) {
    return (
      <div className={cn("mx-auto mb-9 flex max-w-2xl flex-col items-center text-center md:mb-12", className)}>
        {eyebrow && <span className={cn("kicker", dark ? "text-brand-amber" : "text-primary")}>{eyebrow}</span>}
        <h2 className={cn("display mt-2 text-[2rem] md:text-[2.5rem]", dark ? "text-white" : "text-foreground")}>
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              "mt-4 max-w-lg text-[15px] leading-relaxed",
              dark ? "text-white/65" : "text-muted-foreground"
            )}
          >
            {description}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rule-top mb-7 pt-5 md:mb-9 md:pt-6",
        dark && "border-white/15 before:bg-brand-amber",
        className
      )}
    >
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:items-end md:gap-10">
        <div className="min-w-0">
          {eyebrow && <span className={cn("kicker", dark ? "text-brand-amber" : "text-primary")}>{eyebrow}</span>}
          <h2
            className={cn(
              "display text-[1.85rem] sm:text-[2.1rem] md:text-[2.4rem]",
              eyebrow && "mt-1.5",
              dark ? "text-white" : "text-foreground"
            )}
          >
            {title}
          </h2>
        </div>

        {(description || viewMoreHref) && (
          <div className="flex flex-col gap-3 md:items-end md:text-right">
            {description && (
              <p className={cn("text-[14.5px] leading-relaxed", dark ? "text-white/65" : "text-muted-foreground")}>
                {description}
              </p>
            )}
            {viewMoreHref && (
              <Link
                href={viewMoreHref}
                className={cn(
                  "group/viewmore inline-flex w-max items-center gap-2 text-[13px] font-semibold tracking-wide",
                  dark ? "text-white" : "text-foreground hover:text-primary"
                )}
              >
                <span className="underline decoration-current/30 underline-offset-[6px] transition-colors group-hover/viewmore:decoration-current">
                  {viewMoreLabel}
                </span>
                <ArrowRight
                  className="size-3.5 transition-transform duration-300 group-hover/viewmore:translate-x-1"
                  aria-hidden
                />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
