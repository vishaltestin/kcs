"use client";

import { useEffect, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { ProductCard } from "@/components/shared/product-card";
import { cn } from "@/lib/utils";
import type { BlogCard, ProductListItem } from "@/types";

type BrandSlide = { id: number; name: string; slug: string; logo: string | null };

/** Shared arrow styling — circular white buttons that float over the rail edge. */
const ARROW =
  "size-11 rounded-full border-border/80 bg-background/95 text-foreground shadow-[0_10px_24px_-10px_rgb(0_0_0/0.35)] backdrop-blur transition-all duration-300 hover:border-primary hover:bg-primary hover:text-primary-foreground disabled:pointer-events-none disabled:opacity-0";

export function ProductCarousel({ products }: { products: ProductListItem[] }) {
  if (products.length === 0) return null;

  return (
    <Carousel
      opts={{ align: "start", slidesToScroll: "auto" }}
      className="group/carousel relative w-full"
      aria-label="Product carousel"
    >
      <CarouselContent className="-ml-5 py-2">
        {products.map((product) => (
          <CarouselItem key={product.id} className="basis-[78%] pl-5 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
            <ProductCard product={product} />
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious className={cn(ARROW, "-left-3 md:-left-5")} aria-label="Previous products" />
      <CarouselNext className={cn(ARROW, "-right-3 md:-right-5")} aria-label="Next products" />
    </Carousel>
  );
}

export function BlogCarousel({ posts }: { posts: BlogCard[] }) {
  if (posts.length === 0) return null;

  return (
    <Carousel opts={{ align: "start" }} className="group/carousel relative w-full" aria-label="Blog carousel">
      <CarouselContent className="-ml-6 py-2">
        {posts.map((post) => (
          <CarouselItem key={post.id} className="basis-[85%] pl-6 sm:basis-1/2 lg:basis-1/3">
            <BlogTile post={post} />
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious className={cn(ARROW, "-left-3 md:-left-5")} aria-label="Previous posts" />
      <CarouselNext className={cn(ARROW, "-right-3 md:-right-5")} aria-label="Next posts" />
    </Carousel>
  );
}

/** Editorial blog tile shared by the home carousel and the blog index. */
export function BlogTile({ post, className }: { post: BlogCard & { author?: string }; className?: string }) {
  const date = new Date(post.publishedAt);
  return (
    <article
      className={cn(
        "group/post flex h-full flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/[0.07] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-18px_rgb(17_24_39/0.22)]",
        className
      )}
    >
      <Link href={`/blog/${post.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-muted">
        <Image
          src={post.image}
          fill
          sizes="(max-width: 768px) 90vw, 33vw"
          quality={85}
          alt={post.title}
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/post:scale-105"
        />
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur">
          <CalendarDays className="size-3.5 text-primary" aria-hidden />
          {date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-[1.05rem] font-bold leading-snug tracking-tight transition-colors group-hover/post:text-primary">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
        <Link
          href={`/blog/${post.slug}`}
          className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[12.5px] font-bold uppercase tracking-wider text-foreground transition-colors hover:text-primary"
        >
          Read article
          <ArrowUpRight
            className="size-3.5 transition-transform duration-300 group-hover/post:translate-x-0.5 group-hover/post:-translate-y-0.5"
            aria-hidden
          />
        </Link>
      </div>
    </article>
  );
}

export function BrandCarousel({ brands }: { brands: BrandSlide[] }) {
  const withLogo = brands.filter((b) => b.logo);
  if (withLogo.length === 0) return null;

  return (
    <Carousel
      opts={{ align: "start", loop: true }}
      plugins={[Autoplay({ delay: 2600, stopOnInteraction: false, stopOnMouseEnter: true })]}
      className="group/carousel relative w-full"
      aria-label="Brand carousel"
    >
      <CarouselContent className="-ml-4 py-2">
        {withLogo.map((brand) => (
          <CarouselItem key={brand.id} className="basis-1/2 pl-4 sm:basis-1/3 md:basis-1/4 lg:basis-1/6">
            <Link
              href={`/product?brands=${brand.id}`}
              className="group/brand relative flex h-[7.5rem] items-center justify-center overflow-hidden rounded-2xl bg-card p-6 ring-1 ring-foreground/[0.07] transition-all duration-300 hover:-translate-y-0.5 hover:ring-primary/40 hover:shadow-[0_16px_32px_-16px_rgb(17_24_39/0.25)]"
              aria-label={`Browse ${brand.name} products`}
            >
              <Image
                src={brand.logo!}
                alt={brand.name}
                width={160}
                height={80}
                className="max-h-14 w-auto object-contain opacity-80 grayscale transition-all duration-500 group-hover/brand:opacity-100 group-hover/brand:grayscale-0"
              />
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious className={cn(ARROW, "-left-3 md:-left-5 opacity-0 group-hover/carousel:opacity-100")} aria-label="Previous brands" />
      <CarouselNext className={cn(ARROW, "-right-3 md:-right-5 opacity-0 group-hover/carousel:opacity-100")} aria-label="Next brands" />
    </Carousel>
  );
}

/**
 * Hero banner — autoplaying, looping, with pill-style progress dots and a
 * subtle Ken Burns drift on the active slide.
 */
export function BannerCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  // Plugin instance is created once per mount (useState initialiser) so it is
  // stable across renders without reading a ref during render.
  const [plugins] = useState(() => [
    Autoplay({ delay: 5200, stopOnInteraction: false, stopOnMouseEnter: true }),
  ]);

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
      className="group/hero relative h-full w-full overflow-hidden rounded-2xl"
      aria-label="Promotional banner"
    >
      <CarouselContent className="ml-0 h-full">
        {images.map((image, index) => (
          <CarouselItem key={index} className="relative h-full pl-0">
            <div className="relative aspect-[581/511] w-full overflow-hidden">
              <Image
                src={image}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                quality={85}
                className={cn(
                  "object-cover transition-transform duration-[6000ms] ease-linear",
                  current === index ? "scale-[1.06]" : "scale-100"
                )}
                alt={`${alt} ${index + 1}`}
                priority={index === 0}
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>

      {/* Arrows */}
      <button
        type="button"
        onClick={() => api?.scrollPrev()}
        aria-label="Previous banner"
        className="absolute top-1/2 left-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-foreground opacity-0 shadow-lg backdrop-blur transition-all duration-300 hover:bg-white group-hover/hero:opacity-100 focus-visible:opacity-100"
      >
        <ChevronLeft className="size-5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => api?.scrollNext()}
        aria-label="Next banner"
        className="absolute top-1/2 right-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-foreground opacity-0 shadow-lg backdrop-blur transition-all duration-300 hover:bg-white group-hover/hero:opacity-100 focus-visible:opacity-100"
      >
        <ChevronRight className="size-5" aria-hidden />
      </button>

      {/* Dots */}
      <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-1.5" role="tablist" aria-label="Banner slides">
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
