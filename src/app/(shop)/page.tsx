import Image from "next/image";
import Link from "next/link";
import {
  Briefcase,
  BriefcaseBusiness,
  Gift,
  Headphones,
  HomeIcon,
  MoveRight,
  Palette,
  Shirt,
  Shuffle,
  Sparkles,
  Star,
  Timer,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getBrands, getProductsByType } from "@/lib/queries/catalog";
import { getHomeBands, getLatestBlogPosts } from "@/lib/queries/content";
import {
  BannerCarousel,
  BlogCarousel,
  BrandCarousel,
  ProductCarousel,
} from "@/components/shared/carousels";
import { VideoSection } from "@/components/home/video-section";
import { IMAGES, MOST_TRUSTED_HREFS, MOST_TRUSTED_ITEMS } from "@/lib/constants";
import type { HomeBand } from "@/lib/home-bands";
import { cn } from "@/lib/utils";

/**
 * Home page.
 *
 * Layout is the classic kcsgmart front page: a flat charcoal category rail, a
 * 4×3 image mosaic with the banner slider in its 2×2 slot, three boxed product
 * rails, a three-up category promo grid, full-bleed video / drinkware bands and
 * a two-column corporate story. Data still comes from Prisma server components
 * and every image is local, uncropped and genuinely linked.
 */
export default async function HomePage() {
  const [newArrivals, featured, bestSellers, blogs, brands, bands] = await Promise.all([
    getProductsByType("New", 10),
    getProductsByType("Featured", 10),
    getProductsByType("BestSeller", 10),
    getLatestBlogPosts(6),
    getBrands(12),
    getHomeBands(),
  ]);

  return (
    <main className="mt-5 flex flex-col gap-20">
      <TrustedCompanyBanner />
      <ImageGrid />

      <ProductSection title="New Arrivals" filterKey="New" products={newArrivals} />
      <ProductSection title="Featured Products" filterKey="Featured" products={featured} />
      <ProductSection title="Best Sellers" filterKey="BestSeller" products={bestSellers} />

      <PromoSection />
      {bands.video && <VideoSection band={bands.video} />}
      <CorporateGiftingSection />

      {blogs.length > 0 && <BlogSection posts={blogs} />}

      <BrandsSection brands={brands} />
      {bands.drinkware && <DrinkwareSection band={bands.drinkware} />}
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*  Shared bits                                                                */
/* -------------------------------------------------------------------------- */

/** Flat underlined rail header: bold title left, uppercase "View More" right. */
function RailHeader({
  title,
  href,
  label = "View More",
}: {
  title: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <h2 className="text-[1.65rem] leading-[1.35] font-bold tracking-tight md:text-3xl">{title}</h2>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1 text-sm font-bold text-foreground uppercase transition-colors hover:text-primary"
        >
          {label}
          <MoveRight className="ml-1 size-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Most trusted strip                                                         */
/* -------------------------------------------------------------------------- */

const TRUSTED_ICONS = {
  "gift-hampers": Gift,
  "diwali-gifts": Star,
  "tech-gadgets": Headphones,
  "home-living": HomeIcon,
  "bags-luggage": Briefcase,
  "joining-kits": BriefcaseBusiness,
  "gift-combo": Shuffle,
  "t-shirts": Shirt,
  "all-products": Sparkles,
} as const;

function TrustedCompanyBanner() {
  return (
    <section className="container" aria-label="Shop by gifting category">
      <div className="rounded-[5px] bg-brand-charcoal px-4">
        <h1 className="pt-4 pb-1 text-center text-sm leading-relaxed font-extrabold text-white">
          Most Trusted Corporate Gifting Company in India
        </h1>

        <div className="most-trusted flex max-w-full items-center justify-between gap-5 overflow-x-auto py-5 lg:gap-1">
          {MOST_TRUSTED_ITEMS.map((item) => {
            const Icon = TRUSTED_ICONS[item.key as keyof typeof TRUSTED_ICONS] ?? Gift;
            return (
              <Link
                key={item.key}
                href={MOST_TRUSTED_HREFS[item.key] ?? "/product"}
                className="flex flex-col items-center text-center"
              >
                <Icon className="size-10" strokeWidth={1.5} aria-hidden />
                <p className="mt-1 text-sm">{item.label}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hero mosaic — banner slider in the 2×2 slot, category tiles around it      */
/* -------------------------------------------------------------------------- */

/**
 * The mosaic asks nothing of its artwork: each cell simply takes the width of
 * its column and the tile keeps its own ratio (750×656 squares, 750×317 for the
 * wide trade slot). That is what makes the 2×2 slot land at almost exactly the
 * banner's 581×511 ratio — the whole grid assembles itself, no cropping and no
 * letterboxing anywhere.
 */
const GRID_TILES = [
  {
    key: "div2",
    src: IMAGES.homeGrid.diwali,
    href: "/category/diwali-gift-hampers",
    label: "Diwali Gift Hampers",
    width: 750,
    height: 656,
  },
  {
    key: "div3",
    src: IMAGES.homeGrid.mfi,
    href: "/category/trade-schemes",
    label: "MFI Cross-Selling",
    width: 750,
    height: 656,
  },
  {
    key: "div4",
    src: IMAGES.homeGrid.ngo,
    href: "/category/curated-gift-hampers",
    label: "NGO & CSR Requirements",
    width: 750,
    height: 656,
  },
  {
    key: "div5",
    src: IMAGES.homeGrid.pharma,
    href: "/category/corporate-gifting",
    label: "Pharma Gifting",
    width: 750,
    height: 656,
  },
  {
    key: "div6",
    src: IMAGES.homeGrid.trade,
    href: "/category/trade-schemes",
    label: "Trade Schemes",
    width: 750,
    height: 317,
  },
  {
    key: "div7",
    src: IMAGES.homeGrid.gourmet,
    href: "/category/chocolates-dry-fruits",
    label: "Gourmet Range",
    width: 750,
    height: 656,
  },
  {
    key: "div8",
    src: IMAGES.homeGrid.corporate,
    href: "/category/corporate-gifting",
    label: "Corporate Gifting",
    width: 750,
    height: 656,
  },
] as const;

function GridTile({ tile }: { tile: (typeof GRID_TILES)[number] }) {
  const wide = tile.key === "div6";
  return (
    <Link
      href={tile.href}
      aria-label={tile.label}
      className={cn("group/tile block w-full", tile.key)}
    >
      <Image
        src={tile.src}
        alt={tile.label}
        width={tile.width}
        height={tile.height}
        priority={wide}
        sizes={wide ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
        quality={85}
        className="w-full group-hover/tile:scale-105"
      />
    </Link>
  );
}

function ImageGrid() {
  return (
    <section className="container" aria-label="Featured collections">
      <div className="parent">
        <div className="div1 relative">
          <BannerCarousel images={[...IMAGES.homeBanners]} alt="KCS G-Mart corporate gifting banner" />
        </div>
        {GRID_TILES.slice(0, 4).map((tile) => (
          <GridTile key={tile.key} tile={tile} />
        ))}
        {GRID_TILES.slice(4).map((tile) => (
          <GridTile key={tile.key} tile={tile} />
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Product rails                                                              */
/* -------------------------------------------------------------------------- */

function ProductSection({
  title,
  filterKey,
  products,
}: {
  title: string;
  filterKey: string;
  products: Awaited<ReturnType<typeof getProductsByType>>;
}) {
  return (
    <section className="container" aria-label={title}>
      <div className="flex flex-col gap-5">
        <RailHeader title={title} href={`/product?filter=${encodeURIComponent(filterKey)}`} />
        {products.length > 0 ? (
          <ProductCarousel products={products} />
        ) : (
          <p className="py-8 text-center text-muted-foreground">Products coming soon.</p>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Featured categories — image with a white label bar over the bottom         */
/* -------------------------------------------------------------------------- */

function PromoSection() {
  return (
    <section className="container" aria-label="Shop by featured category">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {IMAGES.featuredCategories.map((item) => (
          <div key={item.src} className="group/promo relative">
            <Image
              src={item.src}
              alt={item.alt}
              width={380}
              height={265}
              className="w-full"
              quality={85}
            />
            <Link
              href={item.href}
              className="absolute inset-x-0 bottom-5 left-1/2 w-3/4 -translate-x-1/2 bg-white px-2 py-3 text-center text-[15px] font-semibold text-foreground transition-colors hover:bg-primary hover:text-white"
            >
              {item.label}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Corporate gifting story                                                    */
/* -------------------------------------------------------------------------- */

function CorporateGiftingSection() {
  return (
    <section className="container">
      <div className="flex flex-col items-center gap-8 md:flex-row">
        <div className="flex-1">
          <h2 className="mb-4 text-3xl font-bold tracking-tight">
            Corporate Gifting Company with Pan-India Delivery
          </h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            Who doesn&apos;t like a nice, meaningful gift? We all love it when we receive a little surprise packed
            with beautiful wrapping paper. The excitement of opening the pack and discovering what&apos;s inside is an
            experience we all enjoy. However, we never want to feel disappointed seeing a gift that makes no sense or
            adds nothing to our lives.
          </p>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            Every KCS G-Mart hamper is curated for the recipient, branded in-house, quality-checked and dispatched
            anywhere in India on a single GST invoice.
          </p>

          <ul className="mb-5 grid gap-2 text-[14px] font-medium sm:grid-cols-2">
            {[
              { icon: Truck, text: "19,000+ PIN codes served" },
              { icon: Palette, text: "Logo print, engraving & embroidery" },
              { icon: Timer, text: "Quotes back in hours, not weeks" },
              { icon: Gift, text: "Samples before the bulk run" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2">
                <Icon className="size-4 shrink-0 text-primary" strokeWidth={1.8} aria-hidden />
                {text}
              </li>
            ))}
          </ul>

          <Button asChild variant="link" className="p-0 text-sm font-bold uppercase hover:no-underline">
            <Link href="/product">
              Visit Products
              <MoveRight className="ml-1" aria-hidden />
            </Link>
          </Button>
        </div>

        <div className="flex flex-1 justify-center">
          <Image
            src={IMAGES.panIndia}
            alt="Corporate gifting with pan-India delivery"
            width={520}
            height={359}
            className="rounded-lg shadow-lg"
          />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Blogs                                                                        */
/* -------------------------------------------------------------------------- */

function BlogSection({ posts }: { posts: Awaited<ReturnType<typeof getLatestBlogPosts>> }) {
  return (
    <section className="container" aria-label="Latest blogs">
      <div className="flex flex-col gap-5">
        <RailHeader title="Latest Blogs" href="/blog" label="View More" />
        <BlogCarousel posts={posts} />
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Brands                                                                       */
/* -------------------------------------------------------------------------- */

function BrandsSection({ brands }: { brands: Awaited<ReturnType<typeof getBrands>> }) {
  if (brands.length === 0) return null;

  return (
    <section className="container" aria-label="Popular brands for gifting">
      <h3 className="mb-6 text-center text-3xl font-semibold tracking-tight">Popular Brands for Gifting</h3>
      <BrandCarousel brands={brands} />
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Drinkware band                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Drinkware band. The bundled artwork is a 1180×245 panorama — bottle groups at
 * each edge, empty sky across the middle — so the copy belongs in that middle.
 *
 * Below `lg` the band is a fixed 300px box and the art covers it (the source
 * site's behaviour). At `lg` and up the box takes the artwork's own ratio, so
 * `object-cover` has nothing left to crop: no bottle cap and no baked-in text is
 * ever sliced, which is what `h-[350px] lg:h-auto` + a centred overlay did to
 * the edges. `line-clamp` keeps admin-written copy inside the band instead of
 * pushing past it.
 */
function DrinkwareSection({ band }: { band: HomeBand }) {
  return (
    <section
      className="relative isolate flex h-[300px] items-center justify-center overflow-hidden bg-brand-charcoal px-6 py-7 md:px-10 lg:aspect-[1180/245] lg:h-auto lg:min-h-[230px] lg:py-8"
      aria-label={band.title}
    >
      <Image
        src={band.image}
        alt=""
        aria-hidden
        fill
        sizes="100vw"
        className="-z-20 object-cover"
        quality={85}
      />
      {/* Heavier at the bottom and top edges, where the copy meets the art. */}
      <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/65 via-black/35 to-black/25" />

      {/* One column on a tight 8px rhythm: eyebrow, headline, one support line,
          button — the button reads as part of the block instead of floating
          under it, and the band's own padding keeps everything off the edges. */}
      <div className="flex flex-col items-center gap-2 text-center">
        {band.eyebrow && (
          <p className="line-clamp-1 text-[10.5px] font-semibold tracking-[0.22em] text-white/75 uppercase md:text-[12px]">
            {band.eyebrow}
          </p>
        )}
        <h2 className="line-clamp-2 max-w-[34ch] text-[1.3rem] leading-[1.12] font-bold tracking-tight text-balance text-white uppercase md:text-[1.7rem] lg:text-[1.95rem]">
          {band.title}
        </h2>
        {band.subtitle && (
          <p className="line-clamp-2 max-w-[60ch] text-[12.5px] leading-snug text-pretty text-white/75 md:text-[13.5px]">
            {band.subtitle}
          </p>
        )}
        {band.ctaLabel && band.ctaHref && (
          <Link
            href={band.ctaHref}
            className="mt-1.5 inline-flex items-center gap-2 rounded-[5px] bg-primary px-5 py-2 text-[13px] font-bold tracking-wide text-white uppercase transition-colors hover:bg-brand-blue"
          >
            {band.ctaLabel} <MoveRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>
    </section>
  );
}
