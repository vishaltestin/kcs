import "server-only";

import { db } from "@/lib/db";
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
  const [total, posts] = await Promise.all([
    db.blogPost.count({ where: { isPublished: true } }),
    db.blogPost.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return {
    items: posts,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getBlogPostBySlug(slug: string) {
  return db.blogPost.findFirst({
    where: { slug, isPublished: true },
  });
}
