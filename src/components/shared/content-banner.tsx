import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { IMAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Crumb = { label: string; href?: string };

/**
 * Editorial page hero used by content pages (About Us, Why Us, Contact…).
 * Dark charcoal panel with the brand photograph bleeding in from the right,
 * an eyebrow + title + optional subtitle, and a breadcrumb trail.
 */
export default function Banner({
  imageUrl,
  title,
  eyebrow,
  subtitle,
  crumbs,
  height,
  className,
}: {
  imageUrl?: string;
  title: string;
  eyebrow?: string;
  subtitle?: string;
  crumbs?: Crumb[];
  /** @deprecated kept for backwards compatibility — height is now content-driven */
  height?: string;
  className?: string;
}) {
  const trail: Crumb[] = crumbs ?? [{ label: "Home", href: "/" }, { label: title }];

  return (
    <section className={cn("container mt-4 md:mt-6", className)} aria-label={`${title} banner`}>
      <div
        className={cn(
          "relative isolate overflow-hidden rounded-2xl bg-brand-ink text-white shadow-[0_24px_48px_-24px_rgb(0_0_0/0.45)]",
          height
        )}
      >
        {/* Photograph — right half, feathered into the charcoal */}
        <div className="absolute inset-y-0 right-0 w-full md:w-[58%]" aria-hidden>
          <Image
            src={imageUrl ?? IMAGES.contentBanner}
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 60vw"
            className="object-cover opacity-70 md:opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-ink via-brand-ink/85 to-brand-ink/20 md:via-brand-ink/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-ink/80 via-transparent to-transparent" />
        </div>
        <span
          aria-hidden
          className="absolute -top-32 -left-24 size-[26rem] rounded-full bg-primary/25 blur-[100px]"
        />

        <div className="relative px-6 py-12 sm:px-10 md:px-14 md:py-16 lg:py-20">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-white/60">
              {trail.map((crumb, index) => {
                const last = index === trail.length - 1;
                return (
                  <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                    {crumb.href && !last ? (
                      <Link href={crumb.href} className="transition-colors hover:text-white">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className={cn(last && "font-medium text-white/90")}>{crumb.label}</span>
                    )}
                    {!last && <ChevronRight className="size-3.5 text-white/35" aria-hidden />}
                  </li>
                );
              })}
            </ol>
          </nav>

          {eyebrow && <span className="kicker block text-brand-amber">{eyebrow}</span>}
          <h1 className={cn("display max-w-2xl text-[2.25rem] text-white sm:text-[2.75rem] md:text-[3.25rem]", eyebrow && "mt-2")}>
            {title}
          </h1>
          {subtitle && (
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/70 md:text-base">{subtitle}</p>
          )}
        </div>
      </div>
    </section>
  );
}
