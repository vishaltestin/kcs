import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Briefcase,
  BriefcaseBusiness,
  Building2,
  Gift,
  Headphones,
  HomeIcon,
  MapPinned,
  Palette,
  Shirt,
  Shuffle,
  Sparkles,
  Star,
  Timer,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getProductsByType } from "@/lib/queries/catalog";
import { getLatestBlogPosts } from "@/lib/queries/content";
import { getBrands } from "@/lib/queries/catalog";
import {
  BannerCarousel,
  BlogCarousel,
  BrandCarousel,
  ProductCarousel,
} from "@/components/shared/carousels";
import { SectionHeader } from "@/components/shared/section-header";
import { VideoSection } from "@/components/home/video-section";
import { IMAGES, MOST_TRUSTED_HREFS, MOST_TRUSTED_ITEMS, SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

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

export default async function HomePage() {
  const [newArrivals, featured, bestSellers, blogs, brands] = await Promise.all([
    getProductsByType("New", 10),
    getProductsByType("Featured", 10),
    getProductsByType("BestSeller", 10),
    getLatestBlogPosts(6),
    getBrands(12),
  ]);

  return (
    <main className="mt-4 flex flex-col gap-16 md:mt-6 md:gap-24">
      <TrustedCompanyBanner />
      <ImageGrid />
      <ValueStrip />

      <ProductSection
        eyebrow="Just landed"
        title="New Arrivals"
        description="Fresh additions to the catalogue — hand-picked for upcoming festivals and onboarding drives."
        products={newArrivals}
      />

      <ProductSection
        eyebrow="Curated by our gifting team"
        title="Featured Products"
        description="Proven crowd-pleasers that brand beautifully and ship in bulk without fuss."
        products={featured}
      />

      <PromoSection />

      <ProductSection
        eyebrow="Most ordered this season"
        title="Best Sellers"
        description="What HR teams, marketing leads and founders across India keep coming back for."
        products={bestSellers}
      />

      <VideoSection />
      <CorporateGiftingSection />

      {blogs.length > 0 && (
        <section className="container">
          <SectionHeader
            eyebrow="Insights"
            title="From the Gifting Journal"
            description="Trends, festival calendars and practical guides on corporate gifting."
            viewMoreHref="/blog"
            viewMoreLabel="All articles"
          />
          <BlogCarousel posts={blogs} />
        </section>
      )}

      <BrandsSection brands={brands} />
      <DrinkwareSection />
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*  Most trusted strip                                                         */
/* -------------------------------------------------------------------------- */

function TrustedCompanyBanner() {
  return (
    <section className="container" aria-label="Popular gifting categories">
      <div className="relative isolate overflow-hidden rounded-3xl bg-brand-charcoal text-white shadow-[0_28px_56px_-28px_rgb(0_0_0/0.55)]">
        <div className="dot-grid absolute inset-0 opacity-50" aria-hidden />
        <span aria-hidden className="absolute -top-28 -left-16 size-80 rounded-full bg-primary/30 blur-3xl" />
        <span aria-hidden className="absolute -right-24 -bottom-32 size-80 rounded-full bg-brand-amber/15 blur-3xl" />

        <div className="relative grid gap-8 px-6 py-8 md:px-10 md:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:items-center lg:gap-14">
          <div>
            <span className="eyebrow text-brand-amber">
              <BadgeCheck className="size-4" aria-hidden /> India&apos;s trusted gifting partner
            </span>
            <h2 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight sm:text-[1.75rem] lg:text-[2rem]">
              Most Trusted Corporate Gifting Company in India
            </h2>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/65">
              500+ companies rely on us for festivals, onboarding kits and client appreciation —
              with tiered bulk pricing and pan-India delivery.
            </p>

            <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
              {[
                { value: "500+", label: "Corporate clients" },
                { value: "19k+", label: "PIN codes served" },
                { value: "4.8★", label: "Client rating" },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">{stat.value}</dd>
                  <dd className="mt-0.5 text-[11.5px] leading-tight text-white/55">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="most-trusted grid grid-cols-3 gap-2.5 sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5 md:gap-3">
            {MOST_TRUSTED_ITEMS.map((item) => {
              const Icon = TRUSTED_ICONS[item.key as keyof typeof TRUSTED_ICONS] ?? Gift;
              const href = MOST_TRUSTED_HREFS[item.key] ?? "/product";
              return (
                <Link
                  key={item.key}
                  href={href}
                  className="group/trusted flex flex-col items-center gap-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.04] px-2 py-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.09] lg:flex-row lg:items-center lg:gap-3 lg:px-3.5 lg:py-3 lg:text-left"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/10 text-white transition-all duration-300 group-hover/trusted:bg-primary group-hover/trusted:shadow-[0_10px_24px_-8px_oklch(0.545_0.206_25.5/0.9)] lg:size-10">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <p className="text-[11.5px] font-semibold leading-tight text-white/80 transition-colors group-hover/trusted:text-white">
                    {item.label}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hero grid                                                                  */
/* -------------------------------------------------------------------------- */

const GRID_TILES = [
  { key: "div2", src: IMAGES.homeGrid.diwali, href: "/category/diwali-gift-hampers", label: "Diwali Gift Hampers", note: "Festive range" },
  { key: "div3", src: IMAGES.homeGrid.mfi, href: "/category/trade-schemes", label: "MFI Cross-Selling", note: "Trade & channel" },
  { key: "div4", src: IMAGES.homeGrid.ngo, href: "/category/curated-gift-hampers", label: "NGO & CSR Requirements", note: "Purpose-led" },
  { key: "div5", src: IMAGES.homeGrid.pharma, href: "/category/corporate-gifting", label: "Pharma Gifting", note: "Compliance-friendly" },
  { key: "div7", src: IMAGES.homeGrid.gourmet, href: "/category/chocolates-dry-fruits", label: "Gourmet Range", note: "Chocolates & dry fruits" },
  { key: "div8", src: IMAGES.homeGrid.corporate, href: "/category/corporate-gifting", label: "Corporate Gifting", note: "Everyday essentials" },
] as const;

function GridTile({
  tile,
  wide = false,
}: {
  tile: { key: string; src: string; href: string; label: string; note: string };
  wide?: boolean;
}) {
  return (
    <Link
      href={tile.href}
      aria-label={tile.label}
      className={cn("group/tile relative block h-full w-full overflow-hidden", tile.key)}
    >
      <Image
        src={tile.src}
        alt={tile.label}
        fill
        sizes={wide ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
        className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/tile:scale-[1.06]"
      />
      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 transition-opacity duration-500 group-hover/tile:opacity-95"
      />
      <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
        <span className="min-w-0">
          <span className="block text-[10.5px] font-bold uppercase tracking-[0.16em] text-white/65">{tile.note}</span>
          <span className="mt-0.5 block truncate text-[15px] font-bold text-white">{tile.label}</span>
        </span>
        <span className="grid size-8 shrink-0 translate-y-1 place-items-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur transition-all duration-300 group-hover/tile:translate-y-0 group-hover/tile:opacity-100">
          <ArrowUpRight className="size-4" aria-hidden />
        </span>
      </span>
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
          <div key={tile.key} className={cn(tile.key, "relative")}>
            <GridTile tile={tile} />
          </div>
        ))}
        <div className="div6 relative">
          <Link
            href="/category/trade-schemes"
            aria-label="Trade schemes"
            className="group/tile relative block h-full min-h-[10rem] w-full overflow-hidden"
          >
            <Image
              src={IMAGES.homeGrid.trade}
              alt="Trade schemes"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/tile:scale-[1.05]"
            />
            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            {/* The artwork already carries a "Trade Schemes" title on the left, so the
                caption is kept to the bottom-right on small screens and only expands
                on wide tiles where there is clear space beneath the artwork text. */}
            <span className="absolute inset-x-0 bottom-0 flex items-end justify-end gap-3 p-4 md:justify-between md:p-5">
              <span className="hidden md:block">
                <span className="block text-[10.5px] font-bold uppercase tracking-[0.16em] text-white/65">Channel programmes</span>
                <span className="mt-0.5 block text-[15px] font-bold text-white">Dealer incentives &amp; loyalty rewards</span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[12px] font-bold text-foreground shadow-lg transition-colors group-hover/tile:bg-primary group-hover/tile:text-primary-foreground">
                Explore <ArrowRight className="size-3.5" aria-hidden />
              </span>
            </span>
          </Link>
        </div>
        {GRID_TILES.slice(4).map((tile) => (
          <div key={tile.key} className={cn(tile.key, "relative")}>
            <GridTile tile={tile} />
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Value strip                                                                */
/* -------------------------------------------------------------------------- */

function ValueStrip() {
  const items = [
    { icon: Truck, title: "Pan-India delivery", text: "19,000+ PIN codes, doorstep or desk-drop." },
    { icon: Palette, title: "In-house branding", text: "Logo print, engraving, embroidery & custom packaging." },
    { icon: Timer, title: "Quotes in hours", text: "A dedicated gifting manager on every brief." },
    { icon: Building2, title: "GST invoicing", text: "Clean paperwork for finance & procurement." },
  ];
  return (
    <section className="container" aria-label="Why companies choose KCS G-Mart">
      <ul className="grid grid-cols-1 divide-y divide-border overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/[0.07] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        {items.map(({ icon: Icon, title, text }) => (
          <li key={title} className="group/value flex items-start gap-4 p-5 transition-colors hover:bg-surface sm:p-6">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/[0.08] text-primary transition-all duration-300 group-hover/value:bg-primary group-hover/value:text-primary-foreground group-hover/value:shadow-[0_10px_20px_-8px_oklch(0.545_0.206_25.5/0.8)]">
              <Icon className="size-5" strokeWidth={1.9} aria-hidden />
            </span>
            <div>
              <p className="text-[15px] font-bold tracking-tight">{title}</p>
              <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Product rails                                                              */
/* -------------------------------------------------------------------------- */

function ProductSection({
  title,
  eyebrow,
  description,
  products,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  products: Awaited<ReturnType<typeof getProductsByType>>;
}) {
  const filterKey = title === "Best Sellers" ? "BestSeller" : title;
  return (
    <section className="container">
      <SectionHeader
        title={title}
        eyebrow={eyebrow}
        description={description}
        viewMoreHref={`/product?filter=${encodeURIComponent(filterKey)}`}
      />
      {products.length > 0 ? (
        <ProductCarousel products={products} />
      ) : (
        <p className="py-8 text-center text-muted-foreground">Products coming soon.</p>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Promo categories                                                           */
/* -------------------------------------------------------------------------- */

function PromoSection() {
  return (
    <section className="container">
      <SectionHeader
        eyebrow="Shop by category"
        title="Popular Gifting Categories"
        description="Everything from tech and drinkware to stationery — ready for your logo."
        viewMoreHref="/category"
        viewMoreLabel="All categories"
      />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
        {IMAGES.featuredCategories.map((item, index) => (
          <Link
            key={item.src}
            href={item.href}
            className={cn(
              "group/promo relative isolate block overflow-hidden rounded-2xl bg-muted ring-1 ring-foreground/[0.06] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_44px_-20px_rgb(17_24_39/0.3)]",
              index === 0 && "col-span-2 md:col-span-1"
            )}
          >
            <div className="relative aspect-[380/265] w-full">
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/promo:scale-[1.06]"
              />
            </div>
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent"
            />
            <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-4 md:p-5">
              <span>
                <span className="block text-[10.5px] font-bold uppercase tracking-[0.16em] text-white/60">
                  Collection
                </span>
                <span className="mt-0.5 block text-base font-bold text-white md:text-lg">{item.label}</span>
              </span>
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-foreground shadow-lg transition-all duration-300 group-hover/promo:bg-primary group-hover/promo:text-primary-foreground">
                <ArrowUpRight className="size-4" aria-hidden />
              </span>
            </span>
          </Link>
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
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative order-2 lg:order-1">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-[0_28px_56px_-28px_rgb(0_0_0/0.4)]">
            <Image
              src={IMAGES.panIndia}
              alt="Corporate gifting with pan-India delivery"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          {/* floating stat card */}
          <div className="absolute -bottom-5 right-4 flex items-center gap-3 rounded-2xl bg-background/95 p-4 shadow-[0_18px_40px_-16px_rgb(0_0_0/0.35)] ring-1 ring-foreground/[0.06] backdrop-blur md:-right-6">
            <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
              <MapPinned className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-lg font-extrabold leading-none tracking-tight">19,000+</p>
              <p className="mt-1 text-[11.5px] font-medium text-muted-foreground">PIN codes delivered</p>
            </div>
          </div>
          <span aria-hidden className="absolute -top-6 -left-6 -z-10 size-40 rounded-full bg-primary/10 blur-2xl" />
        </div>

        <div className="order-1 lg:order-2">
          <span className="eyebrow text-primary">Who we are</span>
          <h2 className="mt-3 text-[1.75rem] font-extrabold leading-[1.15] tracking-tight md:text-[2.25rem]">
            Corporate Gifting Company with Pan-India Delivery
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground md:text-base">
            Who doesn&apos;t like a nice, meaningful gift? We all love it when we receive a little
            surprise packed in beautiful wrapping. The excitement of opening the box and discovering
            what&apos;s inside is an experience everyone enjoys — and nobody wants the let-down of a
            gift that adds nothing to their lives.
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground md:text-base">
            That&apos;s why every KCS G-Mart hamper is curated for the recipient, branded in-house,
            quality-checked and delivered anywhere in India.
          </p>

          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "Curated for every budget & brief",
              "Logo branding & custom packaging",
              "Sample approvals before bulk run",
              "Single GST invoice, multi-city dispatch",
            ].map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-sm font-medium">
                <BadgeCheck className="mt-0.5 size-4.5 shrink-0 text-primary" aria-hidden />
                {point}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/product">
                Browse products <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/about-us">Our story</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Brands                                                                     */
/* -------------------------------------------------------------------------- */

function BrandsSection({ brands }: { brands: Awaited<ReturnType<typeof getBrands>> }) {
  if (brands.length === 0) return null;

  return (
    <section className="container">
      <SectionHeader
        center
        eyebrow="Authorised & original"
        title="Popular Brands for Gifting"
        description="Genuine stock from brands your recipients already trust — with brand warranty intact."
      />
      <BrandCarousel brands={brands} />
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Drinkware banner                                                           */
/* -------------------------------------------------------------------------- */

function DrinkwareSection() {
  return (
    <section className="container">
      <div className="relative isolate min-h-[20rem] overflow-hidden rounded-3xl shadow-[0_28px_56px_-28px_rgb(0_0_0/0.5)] md:min-h-[22rem]">
        <Image
          src={IMAGES.drinkware}
          alt="Drinkware for corporate gifts"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/25" />
        <div className="relative flex h-full min-h-[20rem] flex-col items-start justify-center gap-4 p-8 text-white md:min-h-[22rem] md:p-14">
          <span className="eyebrow text-brand-amber">Best price &amp; high quality</span>
          <h3 className="max-w-lg text-[1.75rem] font-extrabold leading-[1.1] tracking-tight md:text-[2.5rem]">
            Drinkware for Corporate Gifts
          </h3>
          <p className="max-w-md text-[15px] leading-relaxed text-white/75">
            Insulated bottles, tumblers and mugs from Borosil, Milton and more — laser-engraved with
            your logo.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/category/drinkwares"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-[15px] font-bold text-primary-foreground shadow-[0_12px_28px_-10px_oklch(0.545_0.206_25.5/0.8)] transition-all duration-300 hover:bg-brand-blue hover:shadow-[0_12px_28px_-10px_rgb(66_162_255/0.8)]"
            >
              Shop now <ArrowRight className="size-4" aria-hidden />
            </Link>
            <a
              href={SITE.phoneHref}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-5 text-[15px] font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              Talk to a gifting manager
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
