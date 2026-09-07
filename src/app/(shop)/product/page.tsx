import type { Metadata } from "next";
import { Suspense } from "react";
import { PackageSearch, SearchX } from "lucide-react";

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
import { PRICE_FILTER_OPTIONS } from "@/lib/constants";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our Products — Corporate Gifts & Branded Merchandise",
  description:
    "Browse the full KCS G-Mart catalogue: branded gifts, hampers, tech gadgets, apparel and joining kits with tiered bulk pricing.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

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
  const cats = (single("cats") ?? "").split(",").filter(Boolean).map(Number);
  const brands = (single("brands") ?? "").split(",").filter(Boolean).map(Number);
  const brandParam = single("brand");
  if (brandParam && !brands.includes(Number(brandParam))) {
    brands.push(Number(brandParam));
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
  const page = Number(single("page") ?? "1") || 1;

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

  return (
    <div className="container mx-auto px-4 py-8 md:py-10">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">{filterTitle ?? "Our Products"}</h1>
          {filterTitle && !q && (
            <p className="text-sm text-muted-foreground mt-1">
              {result.total} product{result.total === 1 ? "" : "s"}{" "}
              <Link href="/product" className="text-primary hover:underline">
                Clear filter
              </Link>
            </p>
          )}
          {q && (
            <p className="text-sm text-muted-foreground mt-1">
              {result.total} result{result.total === 1 ? "" : "s"} for &quot;{q}&quot;{" "}
              <Link href="/product" className="text-primary hover:underline">
                Clear search
              </Link>
            </p>
          )}
          {!q && (
            <p className="text-sm text-muted-foreground mt-1">
              Showing {result.items.length} of {result.total} products
            </p>
          )}
        </div>
        <SortSelect current={sort} />
      </div>

      <div className="flex flex-col gap-8 md:flex-row md:gap-10">
        <ProductFilters categories={categoryTree} brands={brandList} />

        <div className="w-full md:w-3/4">
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
                <Button asChild>
                  <Link href="/product">Clear all filters</Link>
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {result.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
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
  );
}
