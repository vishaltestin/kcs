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
import { formatGrams } from "@/lib/shipping";
import { ReviewForm } from "@/components/forms/review-form";
import { ReviewCard } from "@/components/shop/review-card";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

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

  const isEnquiry = product.pricingMode === "ENQUIRY";
  const isBulk = product.pricingMode === "BULK";
  const hasVariants = product.options.length > 0 && product.variants.length > 0;
  const baseTier = isEnquiry ? undefined : product.prices[0];

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
          <li aria-hidden className="text-muted-foreground/50">›</li>
          <li>
            <Link href="/product" className="hover:text-primary">
              Products
            </Link>
          </li>
          {product.categories[0] && (
            <>
              <li aria-hidden className="text-muted-foreground/50">›</li>
              <li>
                <Link href={`/category/${product.categories[0].slug}`} className="hover:text-primary">
                  {product.categories[0].title}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden className="text-muted-foreground/50">›</li>
          <li className="text-foreground font-medium truncate max-w-[200px]">{product.name}</li>
        </ol>
      </nav>

      <div className="grid gap-10 md:grid-cols-2 md:gap-12">
        <ProductGallery images={product.images} name={product.name} video={product.video} productId={product.id} />

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
                <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
                  <span className="size-1.5 rounded-full bg-success" aria-hidden /> In stock
                </span>
              ) : (
                <span className="text-[11px] font-medium text-muted-foreground">Made to order</span>
              )}
            </div>
            <h1 className="display text-[1.85rem] md:text-[2.4rem]">{product.name}</h1>
          </div>

          <div className="flex items-center gap-2.5">
            <StarRating rating={product.rating?.average ?? 0} />
            <span className="text-sm text-muted-foreground">
              {product.rating
                ? `${product.rating.average.toFixed(1)} · ${product.rating.count} review${product.rating.count === 1 ? "" : "s"}`
                : "No reviews yet"}
            </span>
          </div>

          {/* Price block (variant products render theirs inside ProductActions) */}
          {!hasVariants && (
          <div className="border-y border-foreground/[0.12] py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {isEnquiry ? "Pricing" : isBulk ? "Starting at" : "Price"}
            </p>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className={cn("numeral", baseTier ? "text-[2.6rem] leading-none" : "kicker text-[1.6rem] leading-none")}>
                {baseTier ? formatCurrency(baseTier.price) : "Price on request"}
              </p>
              {baseTier && isBulk && (
                <span className="text-sm font-medium text-muted-foreground">/ piece</span>
              )}
              {baseTier && baseTier.price < baseTier.mrp && (
                <>
                  <p className="numeral text-lg text-muted-foreground line-through">
                    {formatCurrency(baseTier.mrp)}
                  </p>
                  <Badge className="rounded-md bg-primary px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase">
                    {Math.round(((baseTier.mrp - baseTier.price) / baseTier.mrp) * 100)}% off
                  </Badge>
                </>
              )}
            </div>
            {baseTier ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {baseTier.price < baseTier.mrp && (
                  <>
                    You save <strong className="font-semibold text-success">{formatCurrency(baseTier.mrp - baseTier.price)}</strong>
                    {isBulk ? " per piece" : ""} ·{" "}
                  </>
                )}
                {isBulk
                  ? `Slabs get cheaper from ${baseTier.minQuantity}+ pcs`
                  : "Inclusive of all taxes · order from a single piece"}
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Quoted per brief — quantity, branding and delivery decide the final price.
              </p>
            )}
          </div>
          )}

          {product.introtext && <p className="leading-relaxed text-muted-foreground">{product.introtext}</p>}

          {isBulk && !hasVariants && <BulkInquiryTable prices={product.prices} />}

          <ProductActions product={product} />

          {/* Trust notes */}
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5 border-t border-foreground/[0.1] pt-5 sm:grid-cols-4">
            {[
              { icon: Truck, label: "Pan-India delivery" },
              { icon: ShieldCheck, label: "Quality assured" },
              { icon: FileText, label: "GST invoice" },
              { icon: Headset, label: "Dedicated manager" },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-[12.5px] font-medium text-foreground/75">
                <Icon className="size-4 shrink-0 text-primary" strokeWidth={1.8} aria-hidden />
                {label}
              </li>
            ))}
          </ul>

          {product.delivery && (
            <div className="border-l-2 border-primary pl-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Delivery &amp; shipping</h3>
              <p className="mt-1 text-sm text-foreground/85">{product.delivery}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Free shipping on orders above {formatCurrency(1000)}.</p>
            </div>
          )}
        </div>
      </div>

      {/* Specifications (+ derived shipping/tax rows) */}
      <div className="mt-14">
        <ProductSpecifications
          specs={[
            ...product.specs,
            ...(product.options.length > 0
              ? product.options.map((o, i) => ({ id: -100 - i, label: `Available ${o.name.toLowerCase()}s`, value: o.values.join(", ") }))
              : []),
            ...(product.weightGrams > 0
              ? [{ id: -1, label: "Packed weight", value: formatGrams(product.weightGrams) }]
              : []),
            ...(product.dimensionsCm
              ? [{ id: -2, label: "Package dimensions", value: `${product.dimensionsCm.length} × ${product.dimensionsCm.width} × ${product.dimensionsCm.height} cm` }]
              : []),
            ...(product.hsnCode ? [{ id: -3, label: "HSN code", value: `${product.hsnCode} · GST ${product.gstRate}% (included)` }] : []),
          ]}
          description={product.description}
        />
      </div>

      {/* Reviews */}
      <div className="mt-16">
        <div className="rule-top grid gap-6 pt-5 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:gap-14">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <span className="kicker text-primary">What buyers say</span>
            <h2 className="display mt-1.5 text-[1.85rem] md:text-[2.25rem]">Customer Reviews</h2>
            {product.rating ? (
              <div className="mt-5 flex items-end gap-3">
                <span className="numeral text-[3.5rem] leading-none">{product.rating.average.toFixed(1)}</span>
                <div className="pb-1.5">
                  <StarRating rating={product.rating.average} size="sm" />
                  <p className="mt-1 text-xs text-muted-foreground">
                    from {product.rating.count} {product.rating.count === 1 ? "review" : "reviews"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No reviews yet — be the first to share your experience.</p>
            )}
          </div>

          <div>
            {reviews.length === 0 ? (
              <div className="flex items-center gap-4 border-b border-foreground/[0.1] pb-8">
                <MessageSquareQuote className="size-6 text-primary" strokeWidth={1.6} aria-hidden />
                <div>
                  <p className="font-semibold">No reviews yet</p>
                  <p className="text-sm text-muted-foreground">Bought this for your team? Tell others how it landed.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-foreground/[0.1] border-b border-foreground/[0.1]">
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

            <div className="mt-8">
              <h3 className="display text-[1.35rem]">Write a review</h3>
              <p className="mt-1 text-sm text-muted-foreground">Share your experience with this product.</p>
              <div className="mt-5">
                <ReviewForm productId={product.id} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div className="mt-20">
          <SectionHeader eyebrow="Pairs well with" title="You May Also Like" viewMoreHref="/product" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
