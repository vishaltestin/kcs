"use client";

import { useEffect, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";
import { CalendarDays, MoveRight } from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { ProductCard } from "@/components/shared/product-card";
import { FramedImage } from "@/components/shared/framed-image";
import { cn } from "@/lib/utils";
import type { BlogCard, ProductListItem } from "@/types";

type BrandSlide = { id: number; name: string; slug: string; logo: string | null };

/**
 * Rail arrows: small always-visible circles parked in the page gutter
 * (`lg:-left-4`) rather than full-height bars laid across the rail, so they
 * never cover the first / last card's art. Below `md` the gutter is too tight
 * to sit outside, so they tuck against the rail edge instead. `left-*` /
 * `right-*` override the component's `-left-12` default, `size-9` its icon size.
 */
const RAIL_ARROW =
  "z-10 size-9 border-border/70 bg-background/95 text-foreground shadow-[0_6px_18px_-8px_rgb(0_0_0/0.35)] backdrop-blur transition-all duration-200 hover:border-foreground/40 hover:bg-background hover:shadow-lg disabled:invisible";
const RAIL_ARROW_LEFT = cn(RAIL_ARROW, "left-1 md:-left-3 lg:-left-4");
const RAIL_ARROW_RIGHT = cn(RAIL_ARROW, "right-1 md:-right-3 lg:-right-4");

/** Banner arrows are always on, tucked inside the image, as on the reference site. */
const BANNER_ARROW =
  "z-10 border-white/40 bg-white/85 text-foreground shadow-sm hover:bg-white hover:text-foreground";

/* -------------------------------------------------------------------------- */
/*  Product rails                                                              */
/* -------------------------------------------------------------------------- */

export function ProductCarousel({ products }: { products: ProductListItem[] }) {
  if (products.length === 0) return null;

  return (
    <Carousel
      opts={{ align: "start", slidesToScroll: "auto" }}
      className="group/carousel relative w-full"
      aria-label="Product carousel"
    >
      <CarouselContent className="-ml-4">
        {products.map((product) => (
          <CarouselItem key={product.id} className="basis-[82%] pl-4 sm:basis-1/2 md:basis-1/2 lg:basis-1/4">
            {/* Boxed rail card — the flat white tile with a drop shadow. */}
            <div className="h-full bg-card p-2.5 shadow-lg transition-shadow duration-300 hover:shadow-xl">
              <ProductCard product={product} />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious className={RAIL_ARROW_LEFT} aria-label="Previous products" />
      <CarouselNext className={RAIL_ARROW_RIGHT} aria-label="Next products" />
    </Carousel>
  );
}

/* -------------------------------------------------------------------------- */
/*  Blog rail                                                                    */
/* -------------------------------------------------------------------------- */

export function BlogCarousel({ posts }: { posts: BlogCard[] }) {
  if (posts.length === 0) return null;

  return (
    <Carousel opts={{ align: "start" }} className="group/carousel relative w-full" aria-label="Blog carousel">
      <CarouselContent className="-ml-4">
        {posts.map((post) => (
          <CarouselItem key={post.id} className="basis-[86%] pl-4 sm:basis-1/2 lg:basis-1/3">
            <ClassicBlogTile post={post} />
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious className={RAIL_ARROW_LEFT} aria-label="Previous posts" />
      <CarouselNext className={RAIL_ARROW_RIGHT} aria-label="Next posts" />
    </Carousel>
  );
}

/** Home rail tile: image, bold title, two-line standfirst, uppercase read-more. */
function ClassicBlogTile({ post }: { post: BlogCard & { author?: string } }) {
  const date = new Date(post.publishedAt);
  return (
    <article className="group/post flex h-full flex-col">
      <Link href={`/blog/${post.slug}`} className="block">
        <FramedImage
          src={post.image}
          alt={post.title}
          sizes="(max-width: 768px) 86vw, 33vw"
          quality={85}
          className="h-[233px] w-full"
          imgClassName="transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/post:scale-[1.04]"
        />
      </Link>

      <h3 className="mt-3 line-clamp-2 text-[1.1rem] leading-snug font-bold transition-colors group-hover/post:text-primary">
        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
      </h3>

      <p className="mt-1.5 flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
        <CalendarDays className="size-3.5" aria-hidden />
        {date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
      </p>

      <p className="mt-2 line-clamp-2 text-[13px] font-semibold text-muted-foreground">{post.excerpt}</p>

      <Link
        href={`/blog/${post.slug}`}
        className="mt-3 flex w-max items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase transition-colors hover:text-primary"
      >
        Read More <MoveRight className="size-3.5" aria-hidden />
      </Link>
    </article>
  );
}

/** Editorial blog tile shared by the blog index (the home rail uses its own). */
export function BlogTile({ post, className }: { post: BlogCard & { author?: string }; className?: string }) {
  const date = new Date(post.publishedAt);
  return (
    <article className={cn("group/post flex h-full flex-col", className)}>
      <Link href={`/blog/${post.slug}`} className="block">
        <FramedImage
          src={post.image}
          alt={post.title}
          sizes="(max-width: 768px) 90vw, 33vw"
          quality={85}
          className="aspect-[16/10] rounded-xl shadow-[inset_0_0_0_1px_rgb(17_24_39/0.06)]"
          imgClassName="transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/post:scale-[1.03]"
        />
      </Link>
      <div className="flex flex-1 flex-col pt-4">
        <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          <CalendarDays className="size-3.5 text-primary" aria-hidden />
          {date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          {post.author && (
            <>
              <span aria-hidden>·</span>
              <span className="normal-case tracking-normal">{post.author}</span>
            </>
          )}
        </p>
        <h3 className="display mt-2 line-clamp-2 text-[1.25rem] leading-[1.25] text-wrap transition-colors group-hover/post:text-primary">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-muted-foreground">{post.excerpt}</p>
        <Link
          href={`/blog/${post.slug}`}
          className="group/read mt-auto inline-flex w-max items-center gap-1.5 pt-4 text-[12.5px] font-semibold text-foreground transition-colors hover:text-primary"
        >
          <span className="underline decoration-foreground/25 underline-offset-[6px] transition-colors group-hover/read:decoration-primary">
            Read article
          </span>
          <MoveRight
            className="size-3.5 transition-transform duration-300 group-hover/post:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/*  Brand rail                                                                   */
/* -------------------------------------------------------------------------- */

export function BrandCarousel({ brands }: { brands: BrandSlide[] }) {
  const withLogo = brands.filter((b) => b.logo);
  if (withLogo.length === 0) return null;

  return (
    <Carousel opts={{ align: "start" }} className="group/carousel relative w-full" aria-label="Brand carousel">
      <CarouselContent className="-ml-4">
        {withLogo.map((brand) => (
          <CarouselItem key={brand.id} className="basis-1/2 pl-4 sm:basis-1/3 lg:basis-1/6">
            <Link
              href={`/product?brands=${brand.id}`}
              aria-label={`Browse ${brand.name} products`}
              className="group/brand grid h-[150px] place-items-center border-2 border-border bg-background p-4 transition-colors hover:border-primary/60"
            >
              <Image
                src={brand.logo!}
                alt={brand.name}
                width={150}
                height={150}
                className="h-auto max-h-full w-[150px] max-w-full object-contain opacity-85 transition-opacity duration-500 group-hover/brand:opacity-100"
              />
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious className={RAIL_ARROW_LEFT} aria-label="Previous brands" />
      <CarouselNext className={RAIL_ARROW_RIGHT} aria-label="Next brands" />
    </Carousel>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hero banner (mosaic's 2×2 slot)                                            */
/* -------------------------------------------------------------------------- */

/**
 * Banner slider — autoplaying, looping, with the reference's always-visible
 * arrows and progress dots. No crop: each slide is 581×511 artwork with the
 * headline baked into it.
 */
export function BannerCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  // Plugin instance is created once per mount (useState initialiser) so it is
  // stable across renders without reading a ref during render.
  const [plugins] = useState(() => [Autoplay({ delay: 5200, stopOnInteraction: false, stopOnMouseEnter: true })]);

  useEffect(() => {
    if (!api) return;
    const onSelect = (embla: NonNullable<CarouselApi>) => {
      setCurrent(embla.selectedScrollSnap());
    };
    // Embla emits "init"/"reInit" once it has settled, which also seeds the
    // initial index — no synchronous setState needed in the effect body.
    api.on("init", onSelect);
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("init", onSelect);
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  return (
    <Carousel
      setApi={setApi}
      opts={{ align: "start", loop: true }}
      plugins={plugins}
      className="group/hero relative w-full overflow-hidden"
      aria-label="Promotional banner"
    >
      <CarouselContent className="ml-0">
        {images.map((image, index) => (
          <CarouselItem key={index} className="relative pl-0">
            {/* Sized from the artwork (581×511): the slide *is* the banner, so the
                mosaic rows around it set a slot of the same ratio — no crop, no stretch. */}
            <Image
              src={image}
              width={581}
              height={511}
              sizes="(max-width: 768px) 100vw, 50vw"
              quality={85}
              className="w-full"
              alt={`${alt} ${index + 1}`}
              priority={index === 0}
            />
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious className={cn(BANNER_ARROW, "left-[5px]")} aria-label="Previous banner" />
      <CarouselNext className={cn(BANNER_ARROW, "right-[5px]")} aria-label="Next banner" />

      <div
        className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5"
        role="tablist"
        aria-label="Banner slides"
      >
        {images.map((_, index) => (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={current === index}
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => api?.scrollTo(index)}
            className={cn(
              "h-1.5 rounded-full bg-white/60 shadow-sm transition-all duration-500",
              current === index ? "w-7 bg-white" : "w-1.5 hover:bg-white/90"
            )}
          />
        ))}
      </div>
    </Carousel>
  );
}
