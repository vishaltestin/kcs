import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Friendly empty state. The icon sits inside a soft tile with a faint
 * concentric ring so the block reads as intentional rather than broken.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative mx-auto flex w-full max-w-lg flex-col items-center overflow-hidden rounded-3xl border border-dashed border-border/80 bg-surface/60 px-6 text-center",
        compact ? "py-10" : "py-14 md:py-16",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 size-64 -translate-x-1/2 rounded-full bg-primary/[0.06] blur-3xl"
      />
      <div className="relative mb-5 grid place-items-center">
        <span aria-hidden className="absolute size-24 rounded-full border border-primary/10" />
        <span aria-hidden className="absolute size-[7.5rem] rounded-full border border-primary/5" />
        <span className="relative grid size-16 place-items-center rounded-2xl bg-background text-primary shadow-[0_10px_24px_-12px_rgb(0_0_0/0.25)] ring-1 ring-foreground/5">
          <Icon className="size-7" strokeWidth={1.75} aria-hidden />
        </span>
      </div>
      <h3 className="text-lg font-bold tracking-tight">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{action}</div>}
    </div>
  );
}
