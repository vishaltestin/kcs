import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Page header for every admin screen: eyebrow section label, title,
 * description and an actions slot. Compact and consistent so list pages,
 * forms and the dashboard all line up.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow text-primary">{eyebrow}</p>}
        <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight md:text-[1.75rem]">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Ringed panel — the admin equivalent of the storefront card idiom. */
export function Panel({
  title,
  description,
  icon: Icon,
  actions,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/[0.07]", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5">
          <div className="flex items-center gap-3">
            {Icon && (
              <span className="grid size-9 place-items-center rounded-xl bg-primary/[0.08] text-primary">
                <Icon className="size-4" aria-hidden />
              </span>
            )}
            <div>
              {title && <h2 className="text-[15px] font-bold tracking-tight">{title}</h2>}
              {description && <p className="text-[12.5px] text-muted-foreground">{description}</p>}
            </div>
          </div>
          {actions}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  tone?: "default" | "primary" | "warning";
}) {
  return (
    <div className="group/stat relative overflow-hidden rounded-2xl bg-card p-5 ring-1 ring-foreground/[0.07] transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-20px_rgb(17_24_39/0.25)]">
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-10 -right-10 size-28 rounded-full blur-2xl transition-opacity duration-500",
          tone === "primary" && "bg-primary/20",
          tone === "warning" && "bg-brand-amber/30",
          tone === "default" && "bg-foreground/[0.05]"
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
          <p className="mt-2 truncate text-[1.75rem] font-extrabold leading-none tracking-tight tabular-nums">
            {value}
          </p>
          {hint && <p className="mt-2 text-[12.5px] text-muted-foreground">{hint}</p>}
        </div>
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-xl",
            tone === "primary" && "bg-primary text-primary-foreground shadow-[0_10px_20px_-10px_oklch(0.545_0.206_25.5/0.9)]",
            tone === "warning" && "bg-brand-amber/20 text-[#7a5200]",
            tone === "default" && "bg-primary/[0.08] text-primary"
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
      </div>
    </div>
  );
}

const STATUS_TONES: Record<string, string> = {
  PENDING: "bg-brand-amber/15 text-[#7a5200] ring-brand-amber/30",
  CONFIRMED: "bg-brand-blue/10 text-[#1d5fa3] ring-brand-blue/30",
  SHIPPED: "bg-violet-50 text-violet-800 ring-violet-200",
  DELIVERED: "bg-success/10 text-success ring-success/25",
  CANCELLED: "bg-primary/[0.08] text-primary ring-primary/20",
  NEW: "bg-primary/[0.08] text-primary ring-primary/20",
  CONTACTED: "bg-brand-blue/10 text-[#1d5fa3] ring-brand-blue/30",
  CLOSED: "bg-muted text-muted-foreground ring-border",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  NEW: "New",
  CONTACTED: "Contacted",
  CLOSED: "Closed",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ring-1",
        STATUS_TONES[status] ?? "bg-muted text-muted-foreground ring-border",
        className
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
