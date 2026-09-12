import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight, PackageSearch, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shared/product-card";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { EmptyState } from "@/components/shared/empty-state";
import { getCategoryBySlug, getCategoryTree, getFilteredProducts } from "@/lib/queries/catalog";
import { cn } from "@/lib/utils";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCategoryBySlug(slug);
  if (!data) return { title: "Category not found" };

  const category = data.category;
  const title = category.metaTitle || category.title;
  const description =
    category.metaDescription ||
    `Corporate gifting under ${category.title} — curated by KCS G-Mart with tiered bulk pricing and pan-India delivery.`;
  const image = category.ogImage || category.image;

  const keywords = (category.metaKeywords ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: {
      title,
      description,
      ...(image ? { images: [{ url: image, alt: category.title }] } : {}),
      type: "website",
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const data = await getCategoryBySlug(slug);
  if (!data) notFound();

  const { category, categoryIds } = data;

  const pageParam = query.page;
  const rawPage = Math.floor(Number((Array.isArray(pageParam) ? pageParam[0] : pageParam) ?? "1"));
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.min(rawPage, 10_000) : 1;

  const [result, tree] = await Promise.all([
    getFilteredProducts({ categoryIds, page, perPage: 12 }),
    getCategoryTree(),
  ]);

  // Sibling + child categories shown as filter chips.
  const parent = category.parentId ? tree.find((c) => c.id === category.parentId) : null;
  const siblings = parent ? parent.children : tree.filter((c) => c.id !== category.id);
  const children = category.parentId === null
    ? (tree.find((c) => c.id === category.id)?.children ?? [])
    : [];
  const chips = [...children, ...siblings.slice(0, 8)];
  const heroImage = category.ogImage || category.image;

  return (
    <div>
      {/* Category header — split: copy on the left, the category photograph on the right */}
      <section className="container pt-6 md:pt-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
          <ChevronRight className="size-3" aria-hidden />
          <Link href="/category" className="hover:text-primary">
            Categories
          </Link>
          {parent && (
            <>
              <ChevronRight className="size-3" aria-hidden />
              <Link href={`/category/${parent.slug}`} className="hover:text-primary">
                {parent.title}
              </Link>
            </>
          )}
          <ChevronRight className="size-3" aria-hidden />
          <span className="font-medium text-foreground">{category.title}</span>
        </nav>

        <div className="mt-5 grid gap-6 overflow-hidden rounded-2xl bg-brand-ink text-white lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="flex flex-col justify-between px-7 py-8 md:px-10 md:py-10">
            <div>
              <span className="kicker flex items-center gap-2 text-brand-amber">
                {category.isSpecial && <Sparkles className="size-4" aria-hidden />}
                {category.isSpecial ? "Special programme" : parent ? parent.title : "Collection"}
              </span>
              <h1 className="display mt-2 text-[2.25rem] text-white md:text-[3rem]">{category.title}</h1>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/65">
                <span className="numeral text-white">{result.total}</span> {result.total === 1 ? "product" : "products"}{" "}
                · bulk pricing · custom branding available on every piece.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/contact-us"
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-brand-blue"
              >
                Get a quote for this range <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/product"
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/20 px-5 text-[14px] font-semibold text-white transition-colors hover:border-white/50 hover:bg-white/5"
              >
                All products
              </Link>
            </div>
          </div>
          {/* Category artwork is a square studio cut-out — sit it on a plate rather than
              stretching it across the panel, so nothing is sliced off. */}
          <div className="relative flex min-h-[14rem] items-center justify-center px-7 pb-8 lg:min-h-[19rem] lg:px-10 lg:py-8">
            <span aria-hidden className="absolute inset-y-0 left-0 hidden w-px bg-white/10 lg:block" />
            <span aria-hidden className="absolute top-1/2 left-1/2 size-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[90px]" />
            {heroImage ? (
              <div className="studio relative aspect-square w-full max-w-[17rem] overflow-hidden rounded-2xl shadow-[0_30px_60px_-30px_rgb(0_0_0/0.8)] lg:max-w-[19rem]">
                <Image
                  src={heroImage}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 1024px) 272px, 304px"
                  className="object-contain p-5 mix-blend-multiply dark:mix-blend-normal"
                />
              </div>
            ) : (
              <span className="display grid size-40 place-items-center rounded-2xl bg-white/[0.06] text-[5rem] text-white/20">
                {category.title.charAt(0)}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="container py-8 md:py-10">
        {chips.length > 0 && (
          <div className="no-scrollbar -mx-4 mb-8 flex gap-6 overflow-x-auto border-b border-foreground/[0.12] px-4">
            <span className="hidden shrink-0 self-center pb-3 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase sm:inline">
              {children.length > 0 ? "Sub-categories" : "Related"}
            </span>
            {chips.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                aria-current={c.slug === slug ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex h-10 shrink-0 items-center border-b-2 text-[13.5px] font-semibold whitespace-nowrap transition-colors",
                  c.slug === slug
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                )}
              >
                {c.title}
              </Link>
            ))}
          </div>
        )}

        {result.items.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="No products in this category yet"
            description="We're curating new gifting ideas for this category. Check back soon or browse all products."
            action={
              <Button asChild>
                <Link href="/product">Browse all products</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
            {result.items.map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < 4} />
            ))}
          </div>
        )}

        <PaginationControls
          page={result.page}
          totalPages={result.totalPages}
          basePath={`/category/${slug}`}
        />
      </div>
    </div>
  );
}
