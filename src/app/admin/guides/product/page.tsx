import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenText, Printer } from "lucide-react";

import { PageHeader, Panel } from "@/components/admin/ui";
import {
  PRODUCT_FORM_GUIDES,
  PRODUCT_GUIDE_CHAPTERS,
  PRODUCT_GUIDE_SECTIONS,
  SectionGuide,
} from "@/components/admin/products/product-guide";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Product Guide",
  description:
    "How every part of the product form works — pricing tiers, GST, variants, shipping weight, images and SEO — written for whoever is running the catalogue.",
};

/**
 * The handbook behind the product form. Same content as the collapsible
 * "How this works" panels inside the form (single source of truth in
 * `product-guide.tsx`), printed in full so a new operator — or a client
 * handing the console to their own team — can read it once instead of being
 * walked through it in a call.
 */
export default function ProductGuidePage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="Handbook"
        title="How the product form works"
        description="Every card on the product screen, what it controls on the storefront, and the numbers behind it. No demo needed."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/products/new">Go to new product</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/products">Products</Link>
            </Button>
          </>
        }
      />

      {/* Contents */}
      <nav
        aria-label="Guide contents"
        className="mb-8 rounded-2xl bg-card p-5 ring-1 ring-foreground/[0.07] print:hidden"
      >
        <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          <BookOpenText className="size-3.5 text-primary" aria-hidden />
          Contents
        </p>
        <ol className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
          {PRODUCT_GUIDE_SECTIONS.map((section, index) => (
            <li key={section.key}>
              <a
                href={`#${section.key}`}
                className="flex items-baseline gap-2 text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
              >
                <span className="numeral text-[11px] font-bold text-foreground/40 tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="font-semibold text-foreground">{section.title}</span>
              </a>
            </li>
          ))}
          {PRODUCT_GUIDE_CHAPTERS.map((chapter, index) => (
            <li key={chapter.id}>
              <a
                href={`#${chapter.id}`}
                className="flex items-baseline gap-2 text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
              >
                <span className="numeral text-[11px] font-bold text-foreground/40 tabular-nums">
                  {String(PRODUCT_GUIDE_SECTIONS.length + index + 1).padStart(2, "0")}
                </span>
                <span className="font-semibold text-foreground">{chapter.title}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-6">
        {PRODUCT_GUIDE_SECTIONS.map((section, index) => (
          <Panel
            key={section.key}
            title={`${String(index + 1).padStart(2, "0")} · ${section.title}`}
            description={section.blurb}
          >
            <div id={section.key} className="scroll-mt-24">
              <SectionGuide content={PRODUCT_FORM_GUIDES[section.key]} collapsible={false} label="Full guide" />
            </div>
          </Panel>
        ))}

        {PRODUCT_GUIDE_CHAPTERS.map((chapter, index) => (
          <Panel
            key={chapter.id}
            title={`${String(PRODUCT_GUIDE_SECTIONS.length + index + 1).padStart(2, "0")} · ${chapter.title}`}
          >
            <div id={chapter.id} className="space-y-4 scroll-mt-24">
              {chapter.intro && <p className="text-sm leading-relaxed text-muted-foreground">{chapter.intro}</p>}
              <dl className="space-y-3">
                {chapter.points.map((point) => (
                  <div
                    key={point.label}
                    className="grid gap-1 border-b border-foreground/[0.06] pb-3 last:border-0 last:pb-0 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] sm:gap-4"
                  >
                    <dt className="text-[13px] font-bold text-foreground">{point.label}</dt>
                    <dd className="text-[13px] leading-relaxed text-muted-foreground">{point.text}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Panel>
        ))}
      </div>

      <p className="mt-8 flex items-center gap-2 text-xs text-muted-foreground print:hidden">
        <Printer className="size-3.5" aria-hidden />
        Print this page (or save as PDF) to hand the catalogue over to a new team member. Every panel on the product
        form carries the same text in a collapsed &ldquo;How this works&rdquo; strip.
      </p>
    </div>
  );
}
