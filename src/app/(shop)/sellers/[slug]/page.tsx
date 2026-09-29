import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ChevronRight, Package, Store } from "lucide-react";

import { ProductCard } from "@/components/shared/product-card";
import { SortSelect } from "@/components/shop/sort-select";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { EmptyState } from "@/components/shared/empty-state";
import { getFilteredProducts, getVendorBySlug } from "@/lib/queries/catalog";
import { SITE } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const vendor = await getVendorBySlug(slug);
  if (!vendor) return { title: "Seller not found" };
  return {
    title: `${vendor.name} — Seller Storefront`,
    description:
      vendor.description?.slice(0, 160) ??
      `Shop corporate gifts sold by ${vendor.name} on the ${SITE.name} marketplace.`,
  };
}

function clampPage(raw: string | undefined): number {
  const n = Math.floor(Number(raw ?? "1"));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 10_000);
}

export default async function SellerStorefrontPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const single = (key: string) => {
    const value = sp[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const vendor = await getVendorBySlug(slug);
  if (!vendor) notFound();

  const sortParam = single("sort");
  const sort =
    sortParam === "price-asc" || sortParam === "price-desc" || sortParam === "name-asc"
      ? sortParam
      : "newest";
  const page = clampPage(single("page"));

  const result = await getFilteredProducts({
    vendorSlug: vendor.slug,
    sort,
    page,
    perPage: 12,
  });

  return (
    <div className="container py-10 md:py-14">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          Home
        </Link>
        <ChevronRight className="size-3" aria-hidden />
        <Link href="/sellers" className="hover:text-primary">
          Sellers
        </Link>
        <ChevronRight className="size-3" aria-hidden />
        <span className="font-medium text-foreground">{vendor.name}</span>
      </nav>

      {/* Seller banner */}
      <div className="mt-6 flex flex-col gap-5 rounded-2xl bg-card p-6 ring-1 ring-foreground/[0.07] md:flex-row md:items-center md:p-8">
        {vendor.logo ? (
          <span className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-white ring-1 ring-foreground/[0.08]">
            <Image src={vendor.logo} alt="" fill sizes="80px" className="object-contain p-2" />
          </span>
        ) : (
          <span className="grid size-20 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Store className="size-9" aria-hidden />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="display flex flex-wrap items-center gap-2 text-[1.9rem] md:text-[2.4rem]">
            {vendor.name}
            <BadgeCheck className="size-6 text-primary" aria-label="Verified seller" />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verified seller on {SITE.name}
            {vendor.city || vendor.state
              ? ` · ${[vendor.city, vendor.state].filter(Boolean).join(", ")}`
              : ""}{" "}
            · {vendor._count.products} product{vendor._count.products === 1 ? "" : "s"}
          </p>
          {vendor.description && (
            <p className="mt-3 max-w-3xl text-[15px] text-muted-foreground">{vendor.description}</p>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b border-foreground/[0.12] pb-4">
        <p className="text-sm text-muted-foreground">
          {result.total === 0
            ? "No products to show"
            : `${result.total} product${result.total === 1 ? "" : "s"} from this seller`}
        </p>
        <SortSelect current={sort} />
      </div>

      {result.items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="This seller has no live products"
          description="Check back soon — new catalogue drops land here first."
          className="mt-10"
        />
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {result.items.map((product, i) => (
            <ProductCard key={product.id} product={product} priority={i < 4} />
          ))}
        </div>
      )}

      {result.totalPages > 1 && (
        <div className="mt-10">
          <PaginationControls
            page={result.page}
            totalPages={result.totalPages}
            basePath={`/sellers/${vendor.slug}`}
          />
        </div>
      )}
    </div>
  );
}
