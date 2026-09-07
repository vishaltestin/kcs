import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FileText, Headset, MessageSquareQuote, ShieldCheck, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries/catalog";
import { getProductReviews } from "@/lib/queries/catalog";
import { SectionHeader } from "@/components/shared/section-header";
import { StarRating } from "@/components/shared/star-rating";
import { ProductCard } from "@/components/shared/product-card";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductActions } from "@/components/shop/product-actions";
import { BulkInquiryTable } from "@/components/shop/bulk-inquiry-table";
import { ProductSpecifications } from "@/components/shop/product-specifications";
import { ReviewForm } from "@/components/forms/review-form";
import { ReviewCard } from "@/components/shop/review-card";
import { formatCurrency, formatDate } from "@/lib/utils";

type Params = Promise<{ slug: string }>;

function parseKeywords(raw: string | null): string[] | undefined {
  const keywords = (raw ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  return keywords.length > 0 ? keywords : undefined;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  const title = product.metaTitle || product.name;
  const description =
    product.metaDescription ||
    product.introtext ||
    `${product.name} — corporate gifting by KCS G-Mart.`;
  const image = product.ogImage || product.image;

  return {
    title,
    description,
    keywords: parseKeywords(product.metaKeywords),
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title,
      description,
      images: [{ url: image, alt: product.name }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.isActive) notFound();

  const [reviews, related] = await Promise.all([
    getProductReviews(product.id),
    getRelatedProducts(
      product.id,
      product.categories.map((c) => c.id),
      4
    ),
  ]);

  const baseTier = product.prices[0];

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-6">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-primary">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/product" className="hover:text-primary">
              Products
            </Link>
          </li>
          {product.categories[0] && (
            <>
              <li aria-hidden>/</li>
              <li>
                <Link href={`/category/${product.categories[0].slug}`} className="hover:text-primary">
                  {product.categories[0].title}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden>/</li>
          <li className="text-foreground font-medium truncate max-w-[200px]">{product.name}</li>
        </ol>
      </nav>

      <div className="grid gap-10 md:grid-cols-2 md:gap-12">
        <ProductGallery images={product.images} name={product.name} video={product.video} />

        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {product.brand && (
                <Link
                  href={`/product?brands=${product.brandId}`}
                  className="text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
                >
                  {product.brand}
                </Link>
              )}
              {product.sku && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  SKU {product.sku}
                </span>
              )}
              {product.stock > 0 ? (
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                  <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden /> In stock
                </span>
              ) : (
                <span className="text-[11px] font-medium text-muted-foreground">Made to order</span>
              )}
            </div>
            <h1 className="text-2xl font-bold capitalize leading-tight tracking-tight md:text-3xl">
              {product.name}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <StarRating rating={product.rating?.average ?? 0} />
            <span className="text-sm text-muted-foreground">
              {product.rating
                ? `${product.rating.average.toFixed(1)} · ${product.rating.count} review${product.rating.count === 1 ? "" : "s"}`
                : "No reviews yet"}
            </span>
          </div>

          {/* Price block */}
          <div className="rounded-xl border bg-muted/30 p-5">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-3xl font-bold tracking-tight">
                {baseTier ? formatCurrency(baseTier.price) : "Price on request"}
              </p>
              {baseTier && baseTier.price < baseTier.mrp && (
                <>
                  <p className="text-lg text-muted-foreground line-through">
                    {formatCurrency(baseTier.mrp)}
                  </p>
                  <Badge className="bg-primary">
                    Save {formatCurrency(baseTier.mrp - baseTier.price)} (
                    {Math.round(((baseTier.mrp - baseTier.price) / baseTier.mrp) * 100)}%)
                  </Badge>
                </>
              )}
            </div>
            {baseTier && (
              <p className="mt-1.5 text-sm text-muted-foreground">
                Per piece at {baseTier.minQuantity}+ pcs — bulk slabs get cheaper
              </p>
            )}
          </div>

          {product.introtext && <p className="leading-relaxed text-muted-foreground">{product.introtext}</p>}

          <BulkInquiryTable prices={product.prices} />

          <ProductActions product={product} />

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Truck, label: "Pan-India delivery" },
              { icon: ShieldCheck, label: "Quality assured" },
              { icon: FileText, label: "GST invoice" },
              { icon: Headset, label: "Dedicated manager" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1.5 rounded-xl border bg-card p-3 text-center"
              >
                <Icon className="size-5 text-primary" aria-hidden />
                <span className="text-[11px] font-medium leading-tight text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          {product.delivery && (
            <div className="flex items-start gap-3.5 rounded-xl border p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Truck className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="text-sm font-semibold">Delivery & Shipping</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{product.delivery}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Free shipping on orders above {formatCurrency(1000)}.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Specifications */}
      <div className="mt-14">
        <ProductSpecifications specs={product.specs} description={product.description} />
      </div>

      {/* Reviews */}
      <div className="mt-14">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b pb-4">
          <h2 className="text-2xl font-bold tracking-tight">Customer Reviews</h2>
          {product.rating && (
            <div className="flex items-center gap-2.5">
              <StarRating rating={product.rating.average} />
              <span className="text-sm font-semibold">{product.rating.average.toFixed(1)}/5</span>
              <span className="text-sm text-muted-foreground">({product.rating.count})</span>
            </div>
          )}
        </div>
        {reviews.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <MessageSquareQuote className="mx-auto mb-3 size-10 text-muted-foreground/40" aria-hidden />
            <p className="font-medium">No reviews yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Be the first to share your experience.</p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={{
                  id: review.id,
                  authorName: review.authorName,
                  rating: review.rating,
                  title: review.title,
                  comment: review.comment,
                  createdAt: formatDate(review.createdAt),
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-12">
        <h2 className="mb-6 text-2xl font-bold tracking-tight">Write a Review</h2>
        <ReviewForm productId={product.id} />
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div className="mt-16">
          <div className="flex flex-col gap-5">
            <SectionHeader title="You May Also Like" viewMoreHref="/product" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
