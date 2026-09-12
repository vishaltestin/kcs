import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
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
import { FramedImage } from "@/components/shared/framed-image";
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
    <main className="mt-4 flex flex-col gap-16 md:mt-6 md:gap-[6.5rem]">
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
      <div className="relative isolate overflow-hidden rounded-2xl bg-brand-ink text-white shadow-[0_30px_60px_-30px_rgb(0_0_0/0.6)]">
        {/* Faint radial warmth and a wide hairline grid instead of a dot texture */}
        <span aria-hidden className="absolute -top-40 -left-32 size-[34rem] rounded-full bg-primary/25 blur-[110px]" />
        <span aria-hidden className="absolute -right-24 -bottom-40 size-[26rem] rounded-full bg-brand-amber/10 blur-[100px]" />
        <span
          aria-hidden
          className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgb(255_255_255/0.5)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.5)_1px,transparent_1px)] [background-size:96px_96px]"
        />

        <div className="relative grid gap-10 px-6 pt-8 pb-7 md:px-10 md:pt-10 md:pb-9 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16 xl:px-14">
          <div className="flex flex-col">
            <span className="kicker text-brand-amber">India&apos;s trusted gifting partner</span>
            <h1 className="display mt-3 text-[2.25rem] text-white sm:text-[2.75rem] xl:text-[3.25rem]">
              Most <em className="not-italic text-brand-amber">Trusted</em> Corporate Gifting Company in India
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/65">
              500+ companies rely on us for festivals, onboarding kits and client appreciation — with tiered bulk
              pricing and pan-India delivery.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-11 rounded-lg px-6">
                <Link href="/product">
                  Browse the catalogue <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Link
                href="/contact-us"
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/20 px-5 text-[14px] font-semibold text-white transition-colors hover:border-white/50 hover:bg-white/5"
              >
                Get a quote in hours
              </Link>
            </div>

            <dl className="mt-8 grid grid-cols-3 gap-6 border-t border-white/10 pt-6 lg:mt-auto lg:pt-7">
              {[
                { value: "500+", label: "Corporate clients" },
                { value: "19k+", label: "PIN codes served" },
                { value: "4.8", label: "Average client rating", suffix: "/5" },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="numeral text-[1.9rem] leading-none text-white sm:text-[2.25rem]">
                    {stat.value}
                    {stat.suffix && <span className="text-[1rem] text-white/50">{stat.suffix}</span>}
                  </dd>
                  <dd className="mt-2 text-[11px] uppercase tracking-[0.14em] text-white/50">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Category index — a numbered list rather than icon tiles */}
          <div className="lg:border-l lg:border-white/10 lg:pl-12 xl:pl-16">
            <p className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
              Shop by occasion
              <span className="hidden font-normal normal-case tracking-normal text-white/35 sm:inline">
                {MOST_TRUSTED_ITEMS.length} collections
              </span>
            </p>
            <ol className="most-trusted mt-3 grid grid-cols-1 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-1 xl:grid-cols-2">
              {MOST_TRUSTED_ITEMS.map((item, index) => {
                const Icon = TRUSTED_ICONS[item.key as keyof typeof TRUSTED_ICONS] ?? Gift;
                const href = MOST_TRUSTED_HREFS[item.key] ?? "/product";
                return (
                  <li key={item.key} className="border-b border-white/10">
                    <Link
                      href={href}
                      className="group/trusted flex items-center gap-3.5 py-3 text-white/80 transition-colors hover:text-white"
                    >
                      <span className="numeral w-6 shrink-0 text-[12px] text-white/35 transition-colors group-hover/trusted:text-brand-amber">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <Icon className="size-4 shrink-0 text-white/50 transition-colors group-hover/trusted:text-brand-amber" strokeWidth={1.8} aria-hidden />
                      <span className="flex-1 text-[14.5px] font-medium">{item.label}</span>
                      <ArrowUpRight
                        className="size-4 -translate-x-1 text-white/0 transition-all duration-300 group-hover/trusted:translate-x-0 group-hover/trusted:text-white"
                        aria-hidden
                      />
                    </Link>
                  </li>
                );
              })}
            </ol>
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
    <Link href={tile.href} aria-label={tile.label} className={cn("group/tile block h-full w-full", tile.key)}>
      {/* The artwork carries its own title, so it is shown whole — no crop, no second caption */}
      <FramedImage
        src={tile.src}
        alt={tile.label}
        sizes={wide ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
        className="h-full min-h-[10rem] w-full"
        imgClassName="transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/tile:scale-[1.03]"
      >
        <span className="absolute right-3 bottom-3 grid size-8 translate-y-1 place-items-center rounded-full bg-white text-foreground opacity-0 shadow-lg transition-all duration-300 group-hover/tile:translate-y-0 group-hover/tile:opacity-100">
          <ArrowUpRight className="size-4" aria-hidden />
        </span>
      </FramedImage>
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
            <FramedImage
              src={IMAGES.homeGrid.trade}
              alt="Trade schemes"
              sizes="(max-width: 768px) 100vw, 50vw"
              className="absolute inset-0"
              imgClassName="transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/tile:scale-[1.03]"
            />
            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            {/* The artwork already carries a "Trade Schemes" title on the left, so the
                caption is kept to the bottom-right on small screens and only expands
                on wide tiles where there is clear space beneath the artwork text. */}
            <span className="absolute inset-x-0 bottom-0 flex items-end justify-end gap-3 p-4 md:justify-between md:p-5">
              <span className="hidden md:block">
                <span className="block text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/60">Channel programmes</span>
                <span className="display mt-0.5 block text-[1.05rem] text-white">Dealer incentives &amp; loyalty rewards</span>
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
      <ol className="grid grid-cols-1 gap-x-10 gap-y-6 border-y border-foreground/[0.12] py-7 sm:grid-cols-2 md:py-8 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, text }, index) => (
          <li key={title} className="relative flex gap-4 lg:border-l lg:border-foreground/[0.1] lg:pl-6 lg:first:border-l-0 lg:first:pl-0">
            <span className="numeral pt-0.5 text-[13px] text-primary">{String(index + 1).padStart(2, "0")}</span>
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
                <Icon className="size-4 text-foreground/70" strokeWidth={1.8} aria-hidden />
                {title}
              </p>
              <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">{text}</p>
            </div>
          </li>
        ))}
      </ol>
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
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2 md:gap-4">
        {IMAGES.featuredCategories.map((item, index) => {
          const feature = index === 0 || index === 3;
          return (
            <Link
              key={item.src}
              href={item.href}
              aria-label={item.label}
              className={cn(
                "group/promo relative isolate block overflow-hidden rounded-xl shadow-[inset_0_0_0_1px_rgb(17_24_39/0.06)]",
                // The artwork is 380×265 and carries its own title, so every frame keeps
                // that ratio — the feature tiles simply span two rows of it.
                feature ? "col-span-2 aspect-[380/265] md:row-span-2 md:aspect-auto" : "aspect-[380/265]"
              )}
            >
              <FramedImage
                src={item.src}
                alt={item.alt}
                sizes={feature ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
                className="absolute inset-0 rounded-xl"
                imgClassName="transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/promo:scale-[1.03]"
              />
              <span className="absolute right-3 bottom-3 flex items-center gap-2 md:right-4 md:bottom-4">
                <span className="numeral rounded-full bg-black/45 px-2.5 py-1 text-[11px] text-white/85 backdrop-blur-sm">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="grid size-9 translate-y-1 place-items-center rounded-full bg-white text-foreground opacity-0 shadow-lg transition-all duration-300 group-hover/promo:translate-y-0 group-hover/promo:opacity-100">
                  <ArrowUpRight className="size-4" aria-hidden />
                </span>
              </span>
            </Link>
          );
        })}
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
      <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
        {/* Image with an offset outline frame — reads like a mounted print, not a card */}
        <div className="relative order-2 lg:order-1 lg:col-span-6">
          <div className="relative mt-4 ml-4 sm:mt-6 sm:ml-6">
            <span aria-hidden className="absolute -top-4 -left-4 h-full w-full rounded-xl border border-primary/40 sm:-top-6 sm:-left-6" />
            <div className="relative aspect-[3/2] overflow-hidden rounded-xl bg-muted">
              <Image
                src={IMAGES.panIndia}
                alt="Corporate gifting with pan-India delivery"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
          <div className="absolute right-0 -bottom-6 flex items-center gap-4 rounded-xl bg-brand-ink px-5 py-4 text-white shadow-[0_24px_48px_-20px_rgb(0_0_0/0.5)] sm:right-4">
            <MapPinned className="size-5 text-brand-amber" strokeWidth={1.8} aria-hidden />
            <div>
              <p className="numeral text-[1.5rem] leading-none">19,000+</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/55">PIN codes delivered</p>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2 lg:col-span-6 lg:pl-8 xl:pl-14">
          <span className="kicker text-primary">Who we are</span>
          <h2 className="display mt-2 text-[2rem] md:text-[2.6rem]">
            Corporate Gifting Company with Pan-India Delivery
          </h2>
          <blockquote className="mt-6 border-l-2 border-primary pl-5">
            <p className="text-[1.05rem] font-medium leading-relaxed text-foreground/85 md:text-[1.15rem]">
              Who doesn&apos;t like a nice, meaningful gift? We all love it when we receive a little surprise packed
              in beautiful wrapping. The excitement of opening the box and discovering what&apos;s inside is an
              experience everyone enjoys — and nobody wants the let-down of a gift that adds nothing to their lives.
            </p>
          </blockquote>
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground md:text-base">
            That&apos;s why every KCS G-Mart hamper is curated for the recipient, branded in-house, quality-checked
            and delivered anywhere in India.
          </p>

          <ul className="mt-7 grid gap-x-8 gap-y-3 border-t border-foreground/[0.1] pt-6 sm:grid-cols-2">
            {[
              "Curated for every budget & brief",
              "Logo branding & custom packaging",
              "Sample approvals before bulk run",
              "Single GST invoice, multi-city dispatch",
            ].map((point, index) => (
              <li key={point} className="flex items-start gap-3 text-[14px] font-medium">
                <span className="numeral mt-px text-[12px] text-primary">{String(index + 1).padStart(2, "0")}</span>
                {point}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-11 rounded-lg px-6">
              <Link href="/product">
                Browse products <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Link
              href="/about-us"
              className="group/story inline-flex h-11 items-center gap-2 px-2 text-[14px] font-semibold text-foreground transition-colors hover:text-primary"
            >
              <span className="underline decoration-foreground/25 underline-offset-[6px] transition-colors group-hover/story:decoration-primary">
                Our story
              </span>
              <ArrowRight className="size-4 transition-transform duration-300 group-hover/story:translate-x-1" aria-hidden />
            </Link>
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
      <div className="overflow-hidden rounded-2xl bg-brand-ink text-white">
        {/* Panoramic strip shown whole — the bottles sit at both edges of the source */}
        <div className="relative aspect-[1180/245] w-full">
          <Image
            src={IMAGES.drinkware}
            alt="Drinkware for corporate gifts"
            fill
            sizes="(max-width: 1400px) 100vw, 1400px"
            className="object-cover"
          />
          <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-brand-ink via-brand-ink/10 to-transparent" />
        </div>
        <div className="grid gap-8 px-7 pt-2 pb-9 md:px-12 md:pb-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-end lg:gap-12">
          <div>
            <span className="kicker text-brand-amber">Best price &amp; high quality</span>
            <h3 className="display mt-2 text-[2rem] text-white md:text-[2.5rem]">Drinkware for Corporate Gifts</h3>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/65">
              Insulated bottles, tumblers and mugs from Borosil, Milton and more — laser-engraved with your logo.
            </p>
          </div>
          <div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 pt-5 text-[13px] text-white/70">
              {["Insulated bottles", "Tumblers", "Mugs", "Laser engraving"].map((item, index) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="numeral text-[11px] text-brand-amber">{String(index + 1).padStart(2, "0")}</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/category/drinkwares"
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-brand-blue"
              >
                Shop now <ArrowRight className="size-4" aria-hidden />
              </Link>
              <a
                href={SITE.phoneHref}
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/20 px-5 text-[14px] font-semibold text-white transition-colors hover:border-white/50 hover:bg-white/5"
              >
                Talk to a gifting manager
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
