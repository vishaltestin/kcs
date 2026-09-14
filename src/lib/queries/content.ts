import "server-only";

import { db } from "@/lib/db";
import { resolveHomeBands } from "@/lib/home-bands";
import type { BlogCard } from "@/types";

export async function getLatestBlogPosts(limit = 6): Promise<BlogCard[]> {
  const posts = await db.blogPost.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });

  return posts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    image: p.image,
    publishedAt: p.publishedAt.toISOString(),
  }));
}

export async function getBlogPosts(page = 1, perPage = 9) {
  const total = await db.blogPost.count({ where: { isPublished: true } });
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  // Snap out-of-range pages to the last real page.
  const currentPage = Math.min(Math.max(1, Math.floor(page) || 1), totalPages);

  const posts = await db.blogPost.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
    skip: (currentPage - 1) * perPage,
    take: perPage,
  });

  return {
    items: posts,
    total,
    page: currentPage,
    totalPages,
  };
}

export async function getBlogPostBySlug(slug: string) {
  return db.blogPost.findFirst({
    where: { slug, isPublished: true },
  });
}

/** Raw band rows, for the admin form pre-fill. */
export async function getHomeBannerRows() {
  return db.homeBanner.findMany();
}

/**
 * Home page promo bands, resolved against their bundled defaults — see
 * `src/lib/home-bands.ts` for what each shape means.
 */
export async function getHomeBands() {
  const rows = await db.homeBanner.findMany({
    select: {
      slot: true,
      eyebrow: true,
      title: true,
      subtitle: true,
      ctaLabel: true,
      ctaHref: true,
      image: true,
      videoUrl: true,
      isActive: true,
    },
  });
  return resolveHomeBands(rows);
}
