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
      {code && (
        <span
          aria-hidden
          className="numeral pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[clamp(12rem,36vw,26rem)] leading-none text-foreground/[0.045] select-none"
        >
          {code}
        </span>
      )}
      <div className="relative flex max-w-lg flex-col items-center text-center">
        <span className={cn("mb-7 grid size-16 place-items-center rounded-full border", tone === "amber" ? "border-brand-amber/40 text-brand-amber" : "border-primary/30 text-primary")}>
          <Icon className="size-7" strokeWidth={1.75} aria-hidden />
        </span>
        <span className={cn("kicker", tone === "amber" ? "text-brand-amber" : "text-primary")}>{eyebrow}</span>
        <h1 className="display mt-3 text-[2.25rem] md:text-[3rem]">{title}</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{description}</p>
        {actions && <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}
