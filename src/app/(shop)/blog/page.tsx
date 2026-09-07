import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MoveRight, Newspaper } from "lucide-react";

import { PaginationControls } from "@/components/shared/pagination-controls";
import { EmptyState } from "@/components/shared/empty-state";
import { getBlogPosts } from "@/lib/queries/content";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Blog — Corporate Gifting Insights",
  description:
    "Guides, trends and ideas on corporate gifting, employee onboarding kits and branded merchandise from the KCS G-Mart team.",
};

export default async function BlogListingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const pageParam = params.page;
  const page = Number((Array.isArray(pageParam) ? pageParam[0] : pageParam) ?? "1") || 1;

  const { items: posts, totalPages } = await getBlogPosts(page, 9);

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-10">From the Blog</h1>

      {posts.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="No blog posts yet"
          description="We're writing fresh corporate gifting insights — check back soon."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <article key={post.id} className="card-image group">
              <Link href={`/blog/${post.slug}`} className="block overflow-hidden rounded-md">
                <Image
                  src={post.image}
                  alt={post.title}
                  width={800}
                  height={800}
                  className="w-full object-cover blog-image"
                />
              </Link>
              <p className="text-xs text-muted-foreground mt-3 uppercase tracking-wide">
                {formatDate(post.publishedAt)} · {post.author}
              </p>
              <h2 className="font-bold text-lg mt-1 group-hover:text-primary transition-colors">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {post.excerpt}
              </p>
              <Link
                href={`/blog/${post.slug}`}
                className="flex uppercase text-[11px] font-bold items-center gap-2 mt-3 text-muted-foreground hover:text-primary"
              >
                Read More <MoveRight aria-hidden />
              </Link>
            </article>
          ))}
        </div>
      )}

      <PaginationControls page={page} totalPages={totalPages} basePath="/blog" />
    </div>
  );
}
