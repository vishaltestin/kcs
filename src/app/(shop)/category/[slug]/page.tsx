import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shared/product-card";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { EmptyState } from "@/components/shared/empty-state";
import { getCategoryBySlug, getCategoryTree, getFilteredProducts } from "@/lib/queries/catalog";
import { PackageSearch } from "lucide-react";

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
  const page = Number((Array.isArray(pageParam) ? pageParam[0] : pageParam) ?? "1") || 1;

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

  return (
    <div className="flex flex-col gap-y-10 px-4 md:px-20 py-8 md:py-10">
      <div>
        <h1 className="text-3xl md:text-4xl font-black mt-5 text-center">{category.title}</h1>
        <p className="text-center text-sm text-muted-foreground mt-2">
          {result.total} product{result.total === 1 ? "" : "s"} available
        </p>
      </div>

      {(children.length > 0 || siblings.length > 0) && (
        <div className="flex flex-wrap gap-3 justify-center">
          {children.map((child) => (
            <Button
              key={child.id}
              variant={child.slug === slug ? "default" : "outline"}
              size="sm"
              asChild
            >
              <Link href={`/category/${child.slug}`}>{child.title}</Link>
            </Button>
          ))}
          {siblings.slice(0, 8).map((sibling) => (
            <Button
              key={sibling.id}
              variant={sibling.slug === slug ? "default" : "outline"}
              size="sm"
              asChild
            >
              <Link href={`/category/${sibling.slug}`}>{sibling.title}</Link>
            </Button>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {result.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <PaginationControls
        page={result.page}
        totalPages={result.totalPages}
        basePath={`/category/${slug}`}
      />
    </div>
  );
}
