import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MoveRight } from "lucide-react";

import { Button } from "@/components/ui/button";

import { getBlogPostBySlug, getLatestBlogPosts } from "@/lib/queries/content";
import { formatDate, initials } from "@/lib/utils";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Post not found" };

  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt;
  const image = post.ogImage || post.image;

  const keywords = (post.metaKeywords ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title,
      description,
      images: [{ url: image, alt: post.title }],
      type: "article",
      publishedTime: post.publishedAt.toISOString(),
      authors: [post.author],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function BlogDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const related = (await getLatestBlogPosts(4)).filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <article className="container mx-auto max-w-4xl px-4 py-10 md:py-14">
      <nav aria-label="Breadcrumb" className="mb-6">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden /> Back to blog
        </Link>
      </nav>

      <header className="max-w-3xl">
        <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl md:leading-[1.15]">
          {post.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3 border-y py-4">
          <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {initials(post.author)}
          </span>
          <div>
            <p className="text-sm font-semibold">{post.author}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(post.publishedAt)} · {Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200))} min read
            </p>
          </div>
        </div>
      </header>

      <div className="relative mt-8 aspect-[16/8] w-full overflow-hidden rounded-2xl shadow-lg">
        <Image
          src={post.image}
          alt={post.title}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 896px"
        />
      </div>

      <div className="prose prose-neutral mt-10 max-w-none text-foreground/90 prose-p:leading-relaxed prose-p:text-foreground/80">
        {post.content.split(/\n{2,}/).map((para, index) => (
          <p key={index} className="whitespace-pre-line">
            {para}
          </p>
        ))}
      </div>

      <footer className="mt-12 rounded-2xl border bg-muted/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Planning your next gifting campaign? Our managers respond within hours.
        </p>
        <Button asChild className="mt-4">
          <Link href="/contact-us">Get a Quick Quotation</Link>
        </Button>
      </footer>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">More from the blog</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {related.map((item) => (
              <div key={item.id} className="group/post">
                <Link href={`/blog/${item.slug}`} className="block overflow-hidden rounded-xl">
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={500}
                    height={500}
                    className="h-44 w-full object-cover transition-transform duration-500 ease-out group-hover/post:scale-105"
                  />
                </Link>
                <h3 className="mt-3 line-clamp-2 text-sm font-semibold leading-snug">
                  <Link href={`/blog/${item.slug}`} className="transition-colors hover:text-primary">
                    {item.title}
                  </Link>
                </h3>
                <Link
                  href={`/blog/${item.slug}`}
                  className="flex uppercase text-[11px] font-bold items-center gap-1 mt-2 text-muted-foreground hover:text-primary"
                >
                  Read More <MoveRight className="h-3 w-3" aria-hidden />
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
