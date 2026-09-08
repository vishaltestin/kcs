import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  Gift,
  Headset,
  Newspaper,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { BookMeetingButton } from "@/components/book-a-meeting/book-meeting-button";
import { getBlogPostBySlug, getLatestBlogPosts } from "@/lib/queries/content";
import { SITE } from "@/lib/constants";
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

/** Splits stored copy into paragraphs; tolerates \r\n and single-newline authoring. */
function toParagraphs(content: string): string[] {
  const normalised = content.replace(/\r\n?/g, "\n").trim();
  if (!normalised) return [];
  const byBlankLine = normalised.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  // Single-newline authoring (common from admin textareas) → treat each line as a paragraph.
  if (byBlankLine.length === 1 && normalised.includes("\n")) {
    return normalised.split(/\n/).map((p) => p.trim()).filter(Boolean);
  }
  return byBlankLine;
}

export default async function BlogDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const related = (await getLatestBlogPosts(4)).filter((p) => p.slug !== slug).slice(0, 3);
  const paragraphs = toParagraphs(post.content);
  const words = post.content.split(/\s+/).filter(Boolean).length;
  const readMinutes = Math.max(1, Math.ceil(words / 200));

  return (
    <article className="bg-surface/60">
      {/* ── Header band ─────────────────────────────────────────────────── */}
      <div className="border-b bg-surface/70">
        <div className="container mx-auto px-4 pt-7 pb-8 md:pt-9 md:pb-10">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-primary">
              Home
            </Link>
            <span aria-hidden>›</span>
            <Link href="/blog" className="transition-colors hover:text-primary">
              Blog
            </Link>
            <span aria-hidden>›</span>
            <span className="truncate font-medium text-foreground">{post.title}</span>
          </nav>

          <div className="mt-5 max-w-3xl">
            <p className="eyebrow text-primary">Insights &amp; guides</p>
            <h1 className="mt-2 text-3xl font-extrabold leading-[1.12] tracking-tight md:text-[2.6rem]">
              {post.title}
            </h1>
            <p className="mt-4 text-[17px] leading-relaxed text-muted-foreground">{post.excerpt}</p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full bg-primary text-sm font-extrabold text-primary-foreground ring-4 ring-primary/10">
                {initials(post.author)}
              </span>
              <div>
                <p className="text-[13.5px] font-bold leading-tight">{post.author}</p>
                <p className="text-[12px] text-muted-foreground">Corporate gifting desk</p>
              </div>
            </div>
            <span className="hidden h-6 w-px bg-border sm:block" aria-hidden />
            <p className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <CalendarDays className="size-4 text-primary" aria-hidden />
              {formatDate(post.publishedAt)}
            </p>
            <p className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <Clock3 className="size-4 text-primary" aria-hidden />
              {readMinutes} min read
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 md:py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          {/* ── Article ──────────────────────────────────────────────────── */}
          <div className="min-w-0">
            <figure className="relative aspect-[16/8] w-full overflow-hidden rounded-3xl bg-card shadow-[0_28px_56px_-32px_rgb(0_0_0/0.35)] ring-1 ring-foreground/[0.07]">
              <Image
                src={post.image}
                alt={post.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 900px"
              />
            </figure>

            <div className="mt-10 rounded-3xl bg-card px-6 py-8 ring-1 ring-foreground/[0.07] sm:px-10 sm:py-10">
              <div className="mx-auto max-w-[68ch] space-y-6 text-[17px] leading-[1.8] text-foreground/85">
                {paragraphs.length === 0 ? (
                  <p className="text-muted-foreground">This article is being updated — check back soon.</p>
                ) : (
                  paragraphs.map((para, index) => (
                    <p
                      key={index}
                      className={
                        index === 0
                          ? "first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-extrabold first-letter:text-[3.4rem] first-letter:leading-[0.85] first-letter:text-primary"
                          : undefined
                      }
                    >
                      {para}
                    </p>
                  ))
                )}
              </div>

              <div className="mx-auto mt-10 flex max-w-[68ch] flex-wrap items-center justify-between gap-4 border-t pt-6">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-primary/[0.08] text-sm font-extrabold text-primary">
                    {initials(post.author)}
                  </span>
                  <p className="text-[13px] text-muted-foreground">
                    Written by <span className="font-bold text-foreground">{post.author}</span>
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/blog">
                    <ArrowLeft aria-hidden /> All articles
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* ── Rail ─────────────────────────────────────────────────────── */}
          <aside className="space-y-5 lg:sticky lg:top-24">
            <div className="relative overflow-hidden rounded-3xl bg-brand-charcoal p-6 text-white">
              <div aria-hidden className="dot-grid absolute inset-0 opacity-40" />
              <div aria-hidden className="absolute -top-16 -right-10 size-44 rounded-full bg-primary/40 blur-3xl" />
              <div className="relative">
                <p className="eyebrow text-brand-amber">Put it into practice</p>
                <h2 className="mt-2 text-xl font-extrabold leading-tight tracking-tight">
                  Planning your next gifting campaign?
                </h2>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">
                  Our managers reply within hours with curated options, mock-ups and tiered pricing.
                </p>
                <div className="mt-5 flex flex-col gap-2">
                  <Button asChild size="lg" className="w-full">
                    <Link href="/contact-us">
                      Get a Quick Quotation <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                  <BookMeetingButton variant="glass" size="lg" className="w-full" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/[0.07]">
              <p className="eyebrow text-primary">Why teams choose KCS</p>
              <ul className="mt-3 space-y-3">
                {[
                  { icon: Gift, text: "100% customised hampers & kits" },
                  { icon: Sparkles, text: "Free logo mock-up before you order" },
                  { icon: Headset, text: "Dedicated gifting manager" },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3 text-[13.5px] font-medium">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/[0.08] text-primary">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t pt-4 text-[12.5px] text-muted-foreground">
                Call{" "}
                <a href={SITE.phoneHref} className="font-bold text-foreground hover:text-primary">
                  {SITE.phone}
                </a>
              </p>
            </div>
          </aside>
        </div>

        {/* ── Related ─────────────────────────────────────────────────────── */}
        {related.length > 0 && (
          <section className="mt-16">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow text-primary">Keep reading</p>
                <h2 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">More from the blog</h2>
              </div>
              <Button variant="outline" asChild>
                <Link href="/blog">
                  <Newspaper aria-hidden /> All articles
                </Link>
              </Button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/blog/${item.slug}`}
                  className="group/post flex h-full flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/[0.07] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-18px_rgb(17_24_39/0.22)]"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/post:scale-[1.05]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      {formatDate(item.publishedAt)}
                    </p>
                    <h3 className="mt-2 line-clamp-2 text-[15px] font-bold leading-snug transition-colors group-hover/post:text-primary">
                      {item.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{item.excerpt}</p>
                    <span className="mt-auto inline-flex items-center gap-1 pt-4 text-[12.5px] font-bold text-foreground">
                      Read article
                      <ArrowRight className="size-3.5 transition-transform group-hover/post:translate-x-0.5" aria-hidden />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
