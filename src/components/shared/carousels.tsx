"use client";

import Image from "next/image";
import Link from "next/link";
import { MoveRight } from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ProductCard } from "@/components/shared/product-card";
import type { BlogCard, ProductListItem } from "@/types";

type BrandSlide = { id: number; name: string; slug: string; logo: string | null };

export function ProductCarousel({ products }: { products: ProductListItem[] }) {
  if (products.length === 0) return null;

  return (
    <Carousel
      opts={{ align: "start" }}
      className="w-full group/carousel relative"
      aria-label="Product carousel"
    >
      <CarouselContent>
        {products.map((product) => (
          <CarouselItem key={product.id} className="py-2 md:basis-1/2 lg:basis-1/4">
            <ProductCard product={product} />
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious className="absolute left-0 h-full rounded-[10px] opacity-0 group-hover/carousel:opacity-100 focus-visible:opacity-100 transition-opacity duration-300 disabled:invisible bg-white/90" />
      <CarouselNext className="absolute right-0 h-full rounded-[10px] opacity-0 group-hover/carousel:opacity-100 focus-visible:opacity-100 transition-opacity duration-300 disabled:invisible bg-white/90" />
    </Carousel>
  );
}

export function BlogCarousel({ posts }: { posts: BlogCard[] }) {
  if (posts.length === 0) return null;

  return (
    <Carousel opts={{ align: "start" }} className="w-full group/carousel relative" aria-label="Blog carousel">
      <CarouselContent>
        {posts.map((post) => (
          <CarouselItem key={post.id} className="md:basis-1/2 lg:basis-1/3">
            <div className="group/post flex min-h-full h-full flex-col">
              <Link href={`/blog/${post.slug}`} className="block overflow-hidden rounded-lg">
                <Image
                  src={post.image}
                  height={800}
                  width={800}
                  alt={post.title}
                  className="blog-image w-full object-cover transition-transform duration-500 ease-out group-hover/post:scale-105"
                />
              </Link>
              <h3 className="mt-4 line-clamp-2 text-[1.1rem] font-bold leading-snug">{post.title}</h3>
              <small className="mt-1.5 line-clamp-2 text-sm font-medium text-muted-foreground">
                {post.excerpt}
              </small>
              <Link
                href={`/blog/${post.slug}`}
                className="flex uppercase text-[11px] font-bold items-center gap-2 mt-3 text-muted-foreground hover:text-primary"
              >
                Read More <MoveRight aria-hidden />
              </Link>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious className="absolute left-0 h-full rounded-[10px] opacity-0 group-hover/carousel:opacity-100 focus-visible:opacity-100 transition-opacity duration-300 disabled:invisible bg-white/90" />
      <CarouselNext className="absolute right-0 h-full rounded-[10px] opacity-0 group-hover/carousel:opacity-100 focus-visible:opacity-100 transition-opacity duration-300 disabled:invisible bg-white/90" />
    </Carousel>
  );
}

export function BrandCarousel({ brands }: { brands: BrandSlide[] }) {
  const withLogo = brands.filter((b) => b.logo);
  if (withLogo.length === 0) return null;

  return (
    <Carousel opts={{ align: "start" }} className="w-full group/carousel relative" aria-label="Brand carousel">
      <CarouselContent>
        {withLogo.map((brand) => (
          <CarouselItem key={brand.id} className="md:basis-1/3 lg:basis-1/6">
            <Link
              href={`/product?brands=${brand.id}`}
              className="grid place-items-center h-full w-full p-2"
              aria-label={`Browse ${brand.name} products`}
            >
              <Image
                src={brand.logo!}
                alt={brand.name}
                width={200}
                height={200}
                className="w-[130px] h-[130px] object-contain border-2 rounded-md hover:border-primary transition-colors"
              />
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious className="absolute left-0 h-full rounded-[10px] opacity-0 group-hover/carousel:opacity-100 focus-visible:opacity-100 transition-opacity duration-300 disabled:invisible bg-white/90" />
      <CarouselNext className="absolute right-0 h-full rounded-[10px] opacity-0 group-hover/carousel:opacity-100 focus-visible:opacity-100 transition-opacity duration-300 disabled:invisible bg-white/90" />
    </Carousel>
  );
}

export function BannerCarousel({ images, alt }: { images: string[]; alt: string }) {
  return (
    <Carousel
      opts={{ align: "start", loop: true }}
      className="w-full relative rounded-[5px] overflow-hidden"
      aria-label="Promotional banner"
    >
      <CarouselContent>
        {images.map((image, index) => (
          <CarouselItem key={index}>
            <Image
              src={image}
              className="img-fluid w-full h-full object-cover"
              alt={`${alt} ${index + 1}`}
              height={511}
              width={581}
              priority={index === 0}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-[5px]" aria-label="Previous banner" />
      <CarouselNext className="right-[5px]" aria-label="Next banner" />
    </Carousel>
  );
}
