import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronRight, Layers, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCategoryTree } from "@/lib/queries/catalog";
import { IMAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Shop by Category",
  description:
    "Explore KCS G-Mart gifting categories — hampers, tech, apparel, drinkware, stationery and more.",
};

export default async function CategoryListingPage() {
  const categories = await getCategoryTree();
  const regular = categories.filter((c) => !c.isSpecial);
  const special = categories.filter((c) => c.isSpecial);

  return (
    <div>
      {/* Header */}
      <div className="border-b bg-surface/70">
        <div className="container mx-auto px-4 pt-7 pb-8 md:pt-9 md:pb-10">
          <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-primary">
              Home
            </Link>
            <ChevronRight className="size-3" aria-hidden />
            <span className="font-medium text-foreground">Categories</span>
          </nav>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="eyebrow text-primary">Browse the range</p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">Shop by Category</h1>
              <p className="mt-2 text-muted-foreground">
                Curated corporate gifting categories for every occasion, budget and brief.
              </p>
            </div>
            <p className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold ring-1 ring-foreground/[0.07]">
              <Layers className="size-4 text-primary" aria-hidden />
              {categories.length} categories
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 md:py-12">
        {categories.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">Categories coming soon.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {regular.map((category, i) => (
                <CategoryTile key={category.id} category={category} featured={i === 0} />
              ))}
            </div>

            {special.length > 0 && (
              <section className="mt-14">
                <div className="mb-6 flex items-end justify-between gap-4">
                  <div>
                    <p className="eyebrow text-primary">Programmes</p>
                    <h2 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">Special Categories</h2>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
                  {special.map((category) => (
                    <CategoryTile key={category.id} category={category} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Promo strip */}
        <section className="relative mt-14 overflow-hidden rounded-3xl bg-brand-charcoal text-white shadow-[0_28px_56px_-28px_rgb(0_0_0/0.5)]">
          <Image
            src={IMAGES.drinkware}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-50"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
          <div className="relative grid gap-6 px-6 py-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:px-12 md:py-14">
            <div className="max-w-xl">
              <p className="eyebrow text-brand-amber">Best price &amp; high quality</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight md:text-4xl">Drinkware for Corporate Gifts</h2>
              <p className="mt-3 text-sm text-white/75 md:text-base">
                Insulated bottles, tumblers and mugs from Borosil, Milton and more — laser-engraved with your logo.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="xl">
                <Link href="/category/drinkwares">
                  Shop now <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild size="xl" variant="glass">
                <Link href="/contact-us">Talk to us</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function CategoryTile({
  category,
  featured = false,
}: {
  category: Awaited<ReturnType<typeof getCategoryTree>>[number];
  featured?: boolean;
}) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/[0.07] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_24px_48px_-24px_rgb(0_0_0/0.35)]",
        featured && "md:col-span-2 md:row-span-1"
      )}
    >
      <div className={cn("relative overflow-hidden bg-muted", featured ? "aspect-[4/3] md:aspect-[8/3]" : "aspect-[4/3]")}>
        {category.image ? (
          <Image
            src={category.image}
            alt={category.title}
            fill
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
            sizes={featured ? "(max-width: 768px) 50vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-sm text-muted-foreground">{category.title}</div>
        )}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
        {category.isSpecial && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[10px] font-bold tracking-wide text-primary-foreground uppercase">
            <Sparkles className="size-3" aria-hidden /> Special
          </span>
        )}
        <span className="absolute right-3 bottom-3 grid size-9 translate-y-1 place-items-center rounded-full bg-white text-foreground opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="size-4" aria-hidden />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h2 className="text-[15px] font-bold tracking-tight transition-colors group-hover:text-primary">{category.title}</h2>
        {category.children.length > 0 ? (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {category.children.map((c) => c.title).join(" · ")}
          </p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">Explore the collection</p>
        )}
      </div>
    </Link>
  );
}
