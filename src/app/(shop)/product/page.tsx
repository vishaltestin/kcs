import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, PackageSearch, SearchX, Sparkles, Star, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shared/product-card";
import { ProductFilters } from "@/components/shop/product-filters";
import { SortSelect } from "@/components/shop/sort-select";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductGridSkeleton } from "@/components/shared/skeletons";
import {
  getFilteredProducts,
  parsePriceRangeParams,
  getCategoryTree,
  getBrands,
} from "@/lib/queries/catalog";
import { cn } from "@/lib/utils";

/** `?page=` → a sane 1-based integer (junk, negatives and huge values fall back safely). */
function clampPage(raw: string | undefined): number {
  const n = Math.floor(Number(raw ?? "1"));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 10_000);
}

export const metadata: Metadata = {
  title: "Our Products — Corporate Gifts & Branded Merchandise",
  description:
    "Browse the full KCS G-Mart catalogue: branded gifts, hampers, tech gadgets, apparel and joining kits with tiered bulk pricing.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const QUICK_FILTERS = [
  { label: "All", value: "", icon: null },
  { label: "New Arrivals", value: "new", icon: Sparkles },
  { label: "Featured", value: "featured", icon: Star },
  { label: "Best Sellers", value: "bestseller", icon: TrendingUp },
] as const;

export default async function ProductListingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <ProductListingContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ProductListingContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  const single = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const q = single("q") ?? "";
  // Only keep positive integer ids — `?cats=abc` or `?brands=1e9` must not
  // reach Prisma as NaN / out-of-range values.
  const toIds = (raw: string | undefined) =>
    (raw ?? "")
      .split(",")
      .map((v) => Number(v))
      .filter((n) => Number.isSafeInteger(n) && n > 0);
  const cats = toIds(single("cats"));
  const brands = toIds(single("brands"));
  const brandParam = single("brand");
  const legacyBrand = Number(brandParam);
  if (brandParam && Number.isSafeInteger(legacyBrand) && legacyBrand > 0 && !brands.includes(legacyBrand)) {
    brands.push(legacyBrand);
  }
  const filterParam = (single("filter") ?? "").trim().toLowerCase();
  const productType =
    filterParam === "new" || filterParam === "new arrivals"
      ? ("new" as const)
      : filterParam === "featured" || filterParam === "featured products"
        ? ("featured" as const)
        : filterParam === "bestseller" || filterParam === "best seller" || filterParam === "best sellers"
          ? ("bestseller" as const)
          : undefined;
  const filterTitle =
    productType === "new"
      ? "New Arrivals"
      : productType === "featured"
        ? "Featured Products"
        : productType === "bestseller"
          ? "Best Sellers"
          : null;
  const priceLabels = (single("price") ?? "").split(",").filter(Boolean);
  const priceRanges = parsePriceRangeParams(priceLabels);
  const sortParam = single("sort");
  const sort =
    sortParam === "price-asc" || sortParam === "price-desc" || sortParam === "name-asc"
      ? sortParam
      : "newest";
  const page = clampPage(single("page"));

  const [result, categoryTree, brandList] = await Promise.all([
    getFilteredProducts({
      search: q || undefined,
      categoryIds: cats.length > 0 ? cats : undefined,
      brandIds: brands.length > 0 ? brands : undefined,
      productType,
      priceRanges: priceRanges.length > 0 ? priceRanges : undefined,
      sort,
      page,
      perPage: 12,
    }),
    getCategoryTree(),
    getBrands(100),
  ]);

  const rangeStart = result.total === 0 ? 0 : (result.page - 1) * 12 + 1;
  const rangeEnd = Math.min(result.total, (result.page - 1) * 12 + result.items.length);

  // Preserve non-type params when switching quick filters
  const quickHref = (value: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (cats.length) p.set("cats", cats.join(","));
    if (brands.length) p.set("brands", brands.join(","));
    if (priceLabels.length) p.set("price", priceLabels.join(","));
    if (sort !== "newest") p.set("sort", sort);
    if (value) p.set("filter", value);
    const s = p.toString();
    return s ? `/product?${s}` : "/product";
  };

  return (
    <div>
      {/* Header band */}
      <div className="border-b bg-surface/70">
        <div className="container mx-auto px-4 pt-7 pb-6 md:pt-9">
          <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-primary">
              Home
            </Link>
            <ChevronRight className="size-3" aria-hidden />
            <span className="font-medium text-foreground">{filterTitle ?? "Products"}</span>
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-primary">
                {q ? "Search results" : filterTitle ? "Curated selection" : "Full catalogue"}
              </p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
                {q ? (
                  <>
                    Results for <span className="text-primary">&ldquo;{q}&rdquo;</span>
                  </>
                ) : (
                  filterTitle ?? "Our Products"
                )}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {result.total === 0 ? (
                  "No products to show"
                ) : (
                  <>
                    Showing <strong className="font-semibold text-foreground">{rangeStart}–{rangeEnd}</strong> of{" "}
                    <strong className="font-semibold text-foreground">{result.total}</strong>{" "}
                    {result.total === 1 ? "product" : "products"}
                  </>
                )}
                {(q || filterTitle) && (
                  <>
                    {" · "}
                    <Link href="/product" className="font-semibold text-primary hover:underline">
                      {q ? "Clear search" : "Clear filter"}
                    </Link>
                  </>
                )}
              </p>
            </div>
            <SortSelect current={sort} />
          </div>

          {/* Quick type filters */}
          <div className="no-scrollbar mt-5 -mb-px flex gap-2 overflow-x-auto">
            {QUICK_FILTERS.map((f) => {
              const active = (productType ?? "") === f.value;
              const Icon = f.icon;
              return (
                <Link
                  key={f.label}
                  href={quickHref(f.value)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[13px] font-semibold transition-all",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card text-foreground/80 hover:border-primary/40 hover:text-primary"
                  )}
                >
                  {Icon && <Icon className={cn("size-3.5", active ? "text-brand-amber" : "text-primary")} aria-hidden />}
                  {f.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-10">
        <div className="flex flex-col gap-6 md:flex-row md:gap-8 lg:gap-10">
          <ProductFilters categories={categoryTree} brands={brandList} />

          <div className="min-w-0 flex-1">
            {result.items.length === 0 ? (
              <EmptyState
                icon={q ? SearchX : PackageSearch}
                title="No products found"
                description={
                  q
                    ? `We couldn't find any products matching "${q}". Try different keywords or browse the categories.`
                    : "No products match your filters. Try clearing some filters to see more results."
                }
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button asChild>
                      <Link href="/product">Clear all filters</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/contact-us">
                        Ask for a custom quote <ArrowRight aria-hidden />
                      </Link>
                    </Button>
                  </div>
                }
              />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
                  {result.items.map((product, i) => (
                    <ProductCard key={product.id} product={product} priority={i < 3} />
                  ))}
                </div>

                <PaginationControls
                  page={result.page}
                  totalPages={result.totalPages}
                  basePath="/product"
                  params={{
                    ...(filterTitle ? { filter: filterTitle } : {}),
                    ...(q ? { q } : {}),
                    ...(cats.length ? { cats: cats.join(",") } : {}),
                    ...(brands.length ? { brands: brands.join(",") } : {}),
                    ...(priceLabels.length ? { price: priceLabels.join(",") } : {}),
                    ...(sort !== "newest" ? { sort } : {}),
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
