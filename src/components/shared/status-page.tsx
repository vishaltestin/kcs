import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Full-height status screen used by 404 / 403 / error boundaries.
 * A giant ghosted code sits behind the content so the page has presence
 * without feeling alarming.
 */
export function StatusPage({
  code,
  icon: Icon,
  eyebrow,
  title,
  description,
  actions,
  tone = "primary",
}: {
  code?: string;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  tone?: "primary" | "amber";
}) {
  return (
    <div className="relative flex min-h-[72vh] items-center justify-center overflow-hidden px-4 py-16">
      <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(55%_55%_at_50%_45%,black,transparent)]" />
      {code && (
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[clamp(10rem,32vw,22rem)] leading-none font-extrabold tracking-tighter text-foreground/[0.035] select-none"
        >
          {code}
        </span>
      )}
      <div className="relative flex max-w-lg flex-col items-center text-center">
        <span className="relative mb-7 grid place-items-center">
          <span aria-hidden className={cn("absolute size-28 rounded-full border", tone === "amber" ? "border-brand-amber/25" : "border-primary/15")} />
          <span
            className={cn(
              "grid size-20 place-items-center rounded-3xl bg-card shadow-[0_18px_40px_-18px_rgb(0_0_0/0.35)] ring-1 ring-foreground/[0.06]",
              tone === "amber" ? "text-brand-amber" : "text-primary"
            )}
          >
            <Icon className="size-9" strokeWidth={1.75} aria-hidden />
          </span>
        </span>
        <p className={cn("eyebrow", tone === "amber" ? "text-brand-amber" : "text-primary")}>{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
        <p className="mt-3 text-muted-foreground">{description}</p>
        {actions && <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}
