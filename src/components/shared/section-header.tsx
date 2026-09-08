import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Section heading used across the storefront.
 *
 * Left-aligned variant: eyebrow + title (+ optional description) with a
 * "View more" arrow link on the right, separated from the content by a
 * fading hairline. Centered variant: eyebrow + title + description stacked
 * in the middle with a short red accent bar.
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
      <div className={cn("mx-auto mb-8 flex max-w-2xl flex-col items-center text-center md:mb-10", className)}>
        {eyebrow && (
          <span className={cn("eyebrow mb-3", dark ? "text-brand-amber" : "text-primary")}>{eyebrow}</span>
        )}
        <h2
          className={cn(
            "text-2xl font-extrabold tracking-tight md:text-[2.125rem] md:leading-[1.15]",
            dark ? "text-white" : "text-foreground"
          )}
        >
          {title}
        </h2>
        <span
          aria-hidden
          className={cn("mt-4 h-1 w-12 rounded-full", dark ? "bg-brand-amber" : "bg-primary")}
        />
        {description && (
          <p className={cn("mt-4 text-[15px] leading-relaxed", dark ? "text-white/65" : "text-muted-foreground")}>
            {description}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("mb-6 md:mb-8", className)}>
      <div className="flex items-end justify-between gap-6">
        <div className="min-w-0">
          {eyebrow && (
            <span className={cn("eyebrow mb-2.5", dark ? "text-brand-amber" : "text-primary")}>{eyebrow}</span>
          )}
          <h2
            className={cn(
              "text-2xl font-extrabold tracking-tight md:text-[1.875rem] md:leading-tight",
              dark ? "text-white" : "text-foreground"
            )}
          >
            {title}
          </h2>
          {description && (
            <p className={cn("mt-1.5 max-w-xl text-sm leading-relaxed md:text-[15px]", dark ? "text-white/65" : "text-muted-foreground")}>
              {description}
            </p>
          )}
        </div>

        {viewMoreHref && (
          <Link
            href={viewMoreHref}
            className={cn(
              "group/viewmore inline-flex shrink-0 items-center gap-2 rounded-full border py-2 pr-2 pl-4 text-[13px] font-semibold transition-all duration-300",
              dark
                ? "border-white/15 text-white/85 hover:border-white/40 hover:text-white"
                : "border-border bg-background text-foreground hover:border-primary/40 hover:text-primary hover:shadow-[0_8px_18px_-10px_rgb(0_0_0/0.35)]"
            )}
          >
            {viewMoreLabel}
            <span
              className={cn(
                "grid size-6 place-items-center rounded-full transition-colors duration-300",
                dark
                  ? "bg-white/10 text-white group-hover/viewmore:bg-brand-amber group-hover/viewmore:text-black"
                  : "bg-muted text-foreground group-hover/viewmore:bg-primary group-hover/viewmore:text-primary-foreground"
              )}
            >
              <ArrowUpRight
                className="size-3.5 transition-transform duration-300 group-hover/viewmore:translate-x-px group-hover/viewmore:-translate-y-px"
                aria-hidden
              />
            </span>
          </Link>
        )}
      </div>
      <div className={cn("hairline mt-5", dark && "opacity-50")} aria-hidden />
    </div>
  );
}
