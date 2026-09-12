import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronRight, Sparkles } from "lucide-react";

import { getCategoryTree } from "@/lib/queries/catalog";
import { IMAGES, SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Shop by Category",
  description:
    "Explore KCS G-Mart gifting categories — hampers, tech, apparel, drinkware, stationery and more.",
};

const folio = (n: number) => String(n).padStart(2, "0");

export default async function CategoryListingPage() {
  const categories = await getCategoryTree();
  const regular = categories.filter((c) => !c.isSpecial);
  const special = categories.filter((c) => c.isSpecial);
  const subCount = regular.reduce((sum, c) => sum + c.children.length, 0);

  return (
    <div>
      {/* Header */}
      <div className="container pt-6 md:pt-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
          <ChevronRight className="size-3" aria-hidden />
          <span className="font-medium text-foreground">Categories</span>
        </nav>
        <div className="mt-5 grid gap-6 border-b border-foreground/[0.12] pb-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:pb-10">
          <div className="max-w-2xl">
            <span className="kicker text-primary">Browse the range</span>
            <h1 className="display mt-1.5 text-[2.25rem] md:text-[3rem]">Shop by Category</h1>
            <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
              Curated corporate gifting categories for every occasion, budget and brief.
            </p>
          </div>
          <dl className="flex gap-8 md:pb-1">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Categories</dt>
              <dd className="numeral mt-1 text-[1.75rem] leading-none">{folio(categories.length)}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Sub-categories</dt>
              <dd className="numeral mt-1 text-[1.75rem] leading-none">{folio(subCount)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="container py-10 md:py-12">
        {categories.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">Categories coming soon.</p>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14 xl:grid-cols-[15rem_minmax(0,1fr)]">
            {/* Index — sticky on desktop */}
            <nav aria-label="Jump to category" className="lg:sticky lg:top-24 lg:self-start">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Contents</p>
              <ol className="mt-3 flex flex-wrap gap-x-4 gap-y-1 lg:block lg:space-y-0.5">
                {regular.map((category, index) => (
                  <li key={category.id}>
                    <a
                      href={`#cat-${category.slug}`}
                      className="group/idx flex items-baseline gap-3 py-1 text-[13.5px] text-foreground/75 transition-colors hover:text-primary"
                    >
                      <span className="numeral text-[11px] text-muted-foreground group-hover/idx:text-primary">
                        {folio(index + 1)}
                      </span>
                      <span className="truncate">{category.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
              {special.length > 0 && (
                <a
                  href="#special"
                  className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-foreground hover:text-primary"
                >
                  <Sparkles className="size-3.5 text-primary" aria-hidden /> Special programmes
                </a>
              )}
            </nav>

            {/* Branches */}
            <div>
              <div className="divide-y divide-foreground/[0.1] border-t border-foreground/[0.1]">
                {regular.map((category, index) => (
                  <CategoryBranch key={category.id} category={category} index={index + 1} />
                ))}
              </div>

              {special.length > 0 && (
                <section id="special" className="mt-16 scroll-mt-28">
                  <div className="rule-top pt-5">
                    <span className="kicker text-primary">Programmes</span>
                    <h2 className="display mt-1.5 text-[1.85rem] md:text-[2.25rem]">Special Categories</h2>
                  </div>
                  <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
                    {special.map((category) => (
                      <CategoryTile key={category.id} category={category} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        )}

        {/* Promo strip */}
        <section className="mt-16 overflow-hidden rounded-2xl bg-brand-ink text-white">
          {/* Panoramic strip shown whole — the bottles sit at both edges of the source */}
          <div className="relative aspect-[1180/245] w-full">
            <Image src={IMAGES.drinkware} alt="" fill sizes="(max-width: 1400px) 100vw, 1400px" className="object-cover" />
            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-brand-ink via-brand-ink/10 to-transparent" />
          </div>
          <div className="flex flex-col px-7 pt-2 pb-9 md:px-12 md:pb-12">
            <span className="kicker text-brand-amber">Best price &amp; high quality</span>
            <h2 className="display mt-2 text-[1.9rem] text-white md:text-[2.4rem]">Drinkware for Corporate Gifts</h2>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/65">
              Insulated bottles, tumblers and mugs from Borosil, Milton and more — laser-engraved with your logo.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/category/drinkwares"
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-brand-blue"
              >
                Shop now <ArrowRight className="size-4" aria-hidden />
              </Link>
              <a
                href={SITE.phoneHref}
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/20 px-5 text-[14px] font-semibold text-white transition-colors hover:border-white/50 hover:bg-white/5"
              >
                Talk to us
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function CategoryTile({ category }: { category: Awaited<ReturnType<typeof getCategoryTree>>[number] }) {
  return (
    <Link href={`/category/${category.slug}`} className="group flex flex-col">
      <div className="studio relative aspect-square overflow-hidden rounded-xl shadow-[inset_0_0_0_1px_rgb(17_24_39/0.05)]">
        {category.image ? (
          <Image
            src={category.image}
            alt={category.title}
            fill
            className="object-contain p-4 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-sm text-muted-foreground">{category.title}</div>
        )}
        {category.isSpecial && (
          <span className="absolute top-0 left-0 inline-flex items-center gap-1 rounded-br-lg bg-primary px-2.5 py-1.5 text-[10px] font-bold tracking-[0.08em] text-primary-foreground uppercase">
            <Sparkles className="size-3" aria-hidden /> Special
          </span>
        )}
        <span className="absolute right-2.5 bottom-2.5 grid size-9 translate-y-1 place-items-center rounded-full bg-white text-foreground opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="size-4" aria-hidden />
        </span>
      </div>
      <div className="pt-3">
        <h3 className="display text-[1.1rem] leading-snug transition-colors group-hover:text-primary">{category.title}</h3>
        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
          {category.children.length > 0 ? category.children.map((c) => c.title).join(" · ") : "Explore the collection"}
        </p>
      </div>
    </Link>
  );
}

/**
 * One parent category as a "spread": folio number and image on the left,
 * sub-categories set as a two-column typographic list on the right.
 */
function CategoryBranch({
  category,
  index,
}: {
  category: Awaited<ReturnType<typeof getCategoryTree>>[number];
  index: number;
}) {
  const children = category.children;

  return (
    <section id={`cat-${category.slug}`} className="grid scroll-mt-28 gap-6 py-8 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] md:gap-10 md:py-10">
      <Link href={`/category/${category.slug}`} className="group flex gap-4 md:block">
        <div className="studio relative aspect-square w-32 shrink-0 overflow-hidden rounded-xl shadow-[inset_0_0_0_1px_rgb(17_24_39/0.05)] sm:w-40 md:w-full">
          {category.image ? (
            <Image
              src={category.image}
              alt=""
              fill
              sizes="(max-width: 768px) 160px, 272px"
              className="object-contain p-4 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
            />
          ) : (
            <span className="display absolute inset-0 grid place-items-center text-[2.5rem] text-muted-foreground/40">
              {category.title.charAt(0)}
            </span>
          )}
          <span className="numeral absolute top-2.5 left-2.5 rounded-md bg-white/95 px-2 py-1 text-[11px] text-foreground">
            {folio(index)}
          </span>
        </div>
        <div className="min-w-0 md:mt-4">
          <h2 className="display text-[1.5rem] leading-tight transition-colors group-hover:text-primary md:text-[1.7rem]">
            {category.title}
          </h2>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            {children.length > 0
              ? `${children.length} sub-categor${children.length === 1 ? "y" : "ies"}`
              : "Browse the collection"}
          </p>
          <span className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
            <span className="underline decoration-foreground/25 underline-offset-[5px] group-hover:decoration-primary">
              View all
            </span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        </div>
      </Link>

      {children.length === 0 ? (
        <p className="self-center text-sm text-muted-foreground">
          No sub-categories — everything lives under {category.title}.
        </p>
      ) : (
        <ul className={cn("grid gap-x-8 self-start sm:grid-cols-2", children.length > 6 && "xl:grid-cols-3")}>
          {children.map((child, i) => (
            <li key={child.id} className="border-b border-foreground/[0.08]">
              <Link
                href={`/category/${child.slug}`}
                className="group/leaf flex items-center gap-3.5 py-3 transition-colors hover:text-primary"
              >
                <span className="numeral w-8 shrink-0 text-[11px] text-muted-foreground group-hover/leaf:text-primary">
                  {folio(index)}.{i + 1}
                </span>
                <span className="studio relative size-11 shrink-0 overflow-hidden rounded-lg">
                  {child.image ? (
                    <Image src={child.image} alt="" fill sizes="44px" className="object-contain p-1" />
                  ) : (
                    <span className="grid size-full place-items-center text-[11px] font-bold text-muted-foreground">
                      {child.title.charAt(0)}
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-semibold">{child.title}</span>
                  {child.children.length > 0 && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {child.children.map((c) => c.title).join(" · ")}
                    </span>
                  )}
                </span>
                <ArrowUpRight
                  className="size-4 shrink-0 -translate-x-1 text-foreground/0 transition-all group-hover/leaf:translate-x-0 group-hover/leaf:text-primary"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
