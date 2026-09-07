import Image from "next/image";
import Link from "next/link";
import {
  Briefcase,
  BriefcaseBusiness,
  Gift,
  Headphones,
  HomeIcon,
  MoveRight,
  Shirt,
  Shuffle,
  Star,
  Award,
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
import { IMAGES, MOST_TRUSTED_HREFS, MOST_TRUSTED_ITEMS } from "@/lib/constants";

const TRUSTED_ICONS = {
  "gift-hampers": Gift,
  "diwali-gifts": Star,
  "tech-gadgets": Headphones,
  "home-living": HomeIcon,
  "bags-luggage": Briefcase,
  "joining-kits": BriefcaseBusiness,
  "gift-combo": Shuffle,
  "t-shirts": Shirt,
  "all-products": Gift,
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
    <main className="mt-6 flex flex-col gap-16 md:mt-8 md:gap-24">
      <TrustedCompanyBanner />
      <ImageGrid />

      <ProductSection title="New Arrivals" products={newArrivals} />
      <ProductSection title="Featured Products" products={featured} />
      <ProductSection title="BestSeller" products={bestSellers} />

      <PromoSection />
      <VideoSection />
      <CorporateGiftingSection />

      {blogs.length > 0 && (
        <section className="container">
          <div className="flex flex-col gap-5">
            <SectionHeader title="Latest Blogs" viewMoreHref="/blog" />
            <BlogCarousel posts={blogs} />
          </div>
        </section>
      )}

      <BrandsSection brands={brands} />
      <DrinkwareSection />
    </main>
  );
}

function TrustedCompanyBanner() {
  return (
    <section className="container" aria-label="Popular gifting categories">
      <div className="overflow-hidden rounded-2xl bg-[#444444] shadow-lg">
        <div className="flex flex-col items-center gap-1.5 border-b border-white/10 px-6 pt-7 pb-5 text-center">
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400">
            <Award className="size-4" aria-hidden /> India&apos;s trusted gifting partner
          </span>
          <h2 className="text-lg font-extrabold tracking-tight text-white sm:text-xl">
            Most Trusted Corporate Gifting Company in India
          </h2>
          <p className="text-sm text-white/60">
            500+ companies across India rely on us for festivals, onboarding and events
          </p>
        </div>
        <div className="most-trusted grid grid-cols-3 gap-2 p-4 sm:grid-cols-5 lg:grid-cols-9">
          {MOST_TRUSTED_ITEMS.map((item) => {
            const Icon = TRUSTED_ICONS[item.key as keyof typeof TRUSTED_ICONS] ?? Gift;
            const href = MOST_TRUSTED_HREFS[item.key] ?? "/product";
            return (
              <Link
                key={item.key}
                href={href}
                className="group/trusted flex flex-col items-center gap-2.5 rounded-xl px-2 py-4 transition-colors hover:bg-white/10"
              >
                <span className="grid size-14 place-items-center rounded-2xl bg-white/10 text-white transition-all duration-300 group-hover/trusted:-translate-y-1 group-hover/trusted:bg-primary group-hover/trusted:shadow-lg">
                  <Icon className="size-6" aria-hidden />
                </span>
                <p className="text-center text-xs font-medium leading-tight text-white/80 transition-colors group-hover/trusted:text-white">
                  {item.label}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ImageGrid() {
  const grid = IMAGES.homeGrid;

  return (
    <section className="container">
      <div className="parent">
        <div className="div1">
          <BannerCarousel images={[...IMAGES.homeBanners]} alt="KCS G-Mart corporate gifting banner" />
        </div>
        <div className="div2">
          <Link href="/category/diwali-gift-hampers" aria-label="Diwali gift hampers">
            <Image src={grid.diwali} alt="Diwali gift hampers" height={656} width={750} />
          </Link>
        </div>
        <div className="div3">
          <Link href="/category/trade-schemes" aria-label="Trade schemes">
            <Image src={grid.mfi} alt="Trade schemes" height={656} width={750} />
          </Link>
        </div>
        <div className="div4">
          <Link href="/category/curated-gift-hampers" aria-label="NGO and CSR requirements">
            <Image src={grid.ngo} alt="NGO and CSR requirements" height={656} width={750} />
          </Link>
        </div>
        <div className="div5">
          <Link href="/category/corporate-gifting" aria-label="Pharma gifting and promotion">
            <Image src={grid.pharma} alt="Pharma gifting and promotion" height={656} width={750} />
          </Link>
        </div>
        <div className="div6">
          <Link href="/category/trade-schemes" aria-label="Trade schemes">
            <Image src={grid.trade} alt="Trade schemes" height={317} width={750} style={{ maxWidth: "100% !important" }} />
          </Link>
        </div>
        <div className="div7">
          <Link href="/category/chocolates-dry-fruits" aria-label="Gourmet range">
            <Image src={grid.gourmet} alt="Gourmet range" height={656} width={750} />
          </Link>
        </div>
        <div className="div8">
          <Link href="/category/corporate-gifting" aria-label="Corporate gifting">
            <Image src={grid.corporate} alt="Corporate gifting" height={656} width={750} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function ProductSection({
  title,
  products,
}: {
  title: string;
  products: Awaited<ReturnType<typeof getProductsByType>>;
}) {
  return (
    <section className="container">
      <div className="flex flex-col gap-5">
        <SectionHeader title={title} viewMoreHref={`/product?filter=${encodeURIComponent(title)}`} />
        {products.length > 0 ? (
          <ProductCarousel products={products} />
        ) : (
          <p className="text-muted-foreground py-8 text-center">Products coming soon.</p>
        )}
      </div>
    </section>
  );
}

function PromoSection() {
  return (
    <section className="container">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {IMAGES.featuredCategories.map((item) => (
          <div key={item.src} className="promo-slides relative overflow-hidden rounded-lg">
            <Image src={item.src} alt={item.alt} width={500} height={500} className="h-full w-full object-cover" />
            <Link
              href={item.href}
              className="absolute bottom-5 left-1/2 w-3/4 -translate-x-1/2 rounded-md bg-white/95 px-2 py-3 text-center font-medium shadow-lg backdrop-blur-sm transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              {item.label}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function CorporateGiftingSection() {
  return (
    <section className="container">
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1">
          <h2 className="text-3xl font-bold mb-4">
            Corporate Gifting Company | Pan India Delivery
          </h2>
          <p className="text-muted-foreground mb-4">
            Who doesn&apos;t like a nice, meaningful gift? We all love it when we receive a little
            surprise packed with beautiful wrapping paper. The excitement of opening the pack and
            discovering what&apos;s inside is an experience we all enjoy. However, we never want to
            feel disappointed seeing a gift that makes no sense or adds nothing to our lives.
          </p>
          <Link href="/product">
            <Button variant="link" className="text-foreground font-bold text-sm uppercase p-0">
              Visit Products <MoveRight className="ml-1" aria-hidden />
            </Button>
          </Link>
        </div>
        <div className="flex-1 flex justify-center">
          <Image
            src={IMAGES.panIndia}
            alt="Corporate gifting with pan-India delivery"
            width={400}
            height={400}
            className="rounded-lg shadow-lg"
          />
        </div>
      </div>
    </section>
  );
}

function BrandsSection({ brands }: { brands: Awaited<ReturnType<typeof getBrands>> }) {
  if (brands.length === 0) return null;

  return (
    <section className="container">
      <SectionHeader title="Popular Brands for Gifting" center />
      <BrandCarousel brands={brands} />
    </section>
  );
}

function DrinkwareSection() {
  return (
    <section className="container flex items-center justify-center relative h-[350px] lg:h-auto">
      <Image
        src={IMAGES.drinkware}
        alt="Drinkware for corporate gifts"
        width={1500}
        className="w-full h-full lg:h-auto object-cover"
        height={500}
      />
      <div className="text-white uppercase grid place-items-center absolute gap-4 text-center">
        <p className="font-light text-[1.3rem]">Best Price &amp; High Quality</p>
        <h3 className="font-bold text-center text-[1rem] sm:text-[1.4rem] md:text-[2rem] lg:text-[2.3rem]">
          Drinkwares for Corporate Gifts
        </h3>
        <Link
          href="/category/drinkwares"
          className="flex gap-2 items-center font-bold text-[15px] px-6 py-3 bg-[#C31C18] rounded-[5px] hover:bg-[#42a2ff] transition-colors"
        >
          SHOP NOW <MoveRight aria-hidden />
        </Link>
      </div>
    </section>
  );
}
