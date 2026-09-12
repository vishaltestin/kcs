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
        "relative mx-auto flex w-full max-w-lg flex-col items-center border border-dashed border-foreground/20 px-6 text-center",
        compact ? "py-10" : "py-14 md:py-16",
        className
      )}
    >
      <span className="mb-5 grid size-14 place-items-center rounded-full border border-primary/30 text-primary">
        <Icon className="size-6" strokeWidth={1.75} aria-hidden />
      </span>
      <h3 className="display text-[1.4rem]">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{action}</div>}
    </div>
  );
}
