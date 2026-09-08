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
      {/* Category hero */}
      <section className="relative overflow-hidden bg-brand-charcoal text-white">
        {heroImage && (
          <Image src={heroImage} alt="" fill priority sizes="100vw" className="object-cover opacity-40" />
        )}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />
        <div aria-hidden className="dot-grid absolute inset-0 opacity-30" />
        <div className="container relative mx-auto px-4 py-12 md:py-16">
          <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-white/60">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <ChevronRight className="size-3" aria-hidden />
            <Link href="/category" className="hover:text-white">
              Categories
            </Link>
            {parent && (
              <>
                <ChevronRight className="size-3" aria-hidden />
                <Link href={`/category/${parent.slug}`} className="hover:text-white">
                  {parent.title}
                </Link>
              </>
            )}
            <ChevronRight className="size-3" aria-hidden />
            <span className="font-medium text-white">{category.title}</span>
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="eyebrow flex items-center gap-1.5 text-brand-amber">
                {category.isSpecial && <Sparkles className="size-3.5" aria-hidden />}
                {category.isSpecial ? "Special programme" : parent ? parent.title : "Collection"}
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-5xl">{category.title}</h1>
              <p className="mt-3 text-sm text-white/70 md:text-base">
                {result.total} {result.total === 1 ? "product" : "products"} · bulk pricing · custom branding available
              </p>
            </div>
            <Button asChild variant="glass" size="lg">
              <Link href="/contact-us">
                Get a quote for this range <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 md:py-10">
        {chips.length > 0 && (
          <div className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1">
            <span className="mr-1 hidden shrink-0 self-center text-xs font-semibold tracking-wide text-muted-foreground uppercase sm:inline">
              {children.length > 0 ? "Sub-categories" : "Related"}
            </span>
            {chips.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                aria-current={c.slug === slug ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center rounded-full border px-4 text-[13px] font-semibold transition-all",
                  c.slug === slug
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-foreground/80 hover:border-primary/40 hover:text-primary"
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
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
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
