import type { Metadata } from "next";
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
import { FramedImage } from "@/components/shared/framed-image";
import { BlogTile } from "@/components/shared/carousels";
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
    <article>
      {/* ── Masthead ────────────────────────────────────────────────────── */}
      <div className="container pt-8 md:pt-12">
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

        <div className="mt-8 grid gap-8 border-b border-foreground/[0.12] pb-10 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-16">
          <div className="max-w-3xl">
            <span className="kicker text-primary">Insights &amp; guides</span>
            <h1 className="display mt-3 text-[2.25rem] leading-[1.08] md:text-[3.25rem]">{post.title}</h1>
            <p className="mt-5 text-[17px] leading-relaxed text-muted-foreground">{post.excerpt}</p>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 self-end text-[13px] sm:grid-cols-3 lg:grid-cols-1">
            <div>
              <dt className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Written by</dt>
              <dd className="mt-1 flex items-center gap-2 font-semibold">
                <span className="display grid size-8 place-items-center rounded-full bg-brand-ink text-[12px] text-white">
                  {initials(post.author)}
                </span>
                {post.author}
              </dd>
            </div>
            <div>
              <dt className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Published</dt>
              <dd className="mt-1 inline-flex items-center gap-1.5 font-medium">
                <CalendarDays className="size-3.5 text-primary" aria-hidden />
                {formatDate(post.publishedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Reading time</dt>
              <dd className="mt-1 inline-flex items-center gap-1.5 font-medium">
                <Clock3 className="size-3.5 text-primary" aria-hidden />
                {readMinutes} min read
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="container py-10 md:py-12">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-16">
          {/* ── Article ──────────────────────────────────────────────────── */}
          <div className="min-w-0">
            <figure>
              <FramedImage
                src={post.image}
                alt={post.title}
                priority
                sizes="(max-width: 1024px) 100vw, 900px"
                className="aspect-[16/9] w-full rounded-xl shadow-[inset_0_0_0_1px_rgb(17_24_39/0.06)]"
              />
            </figure>

            <div className="mx-auto mt-12 max-w-[68ch] space-y-7 text-[17px] leading-[1.8] text-foreground/85">
              {paragraphs.length === 0 ? (
                <p className="text-muted-foreground">This article is being updated — check back soon.</p>
              ) : (
                paragraphs.map((para, index) => (
                  <p
                    key={index}
                    className={
                      index === 0
                        ? "display text-[1.25rem] leading-[1.6]! text-foreground first-letter:float-left first-letter:mt-1 first-letter:mr-3 first-letter:text-[3.6rem] first-letter:leading-[0.85] first-letter:text-primary"
                        : undefined
                    }
                  >
                    {para}
                  </p>
                ))
              )}
            </div>

            <div className="mx-auto mt-12 flex max-w-[68ch] flex-wrap items-center justify-between gap-4 border-t border-foreground/[0.12] pt-6">
              <div className="flex items-center gap-3">
                <span className="display grid size-10 place-items-center rounded-full bg-brand-ink text-[13px] text-white">
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

          {/* ── Rail ─────────────────────────────────────────────────────── */}
          <aside className="space-y-8 lg:sticky lg:top-24">
            <div className="relative overflow-hidden rounded-xl bg-brand-ink p-6 text-white">
              <span aria-hidden className="absolute -top-16 -right-10 size-44 rounded-full bg-primary/30 blur-3xl" />
              <div className="relative">
                <span className="kicker text-brand-amber">Put it into practice</span>
                <h2 className="display mt-2.5 text-[1.5rem] leading-tight text-white">
                  Planning your next gifting campaign?
                </h2>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-white/70">
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

            <div className="rule-top pt-5">
              <span className="kicker text-primary">Why teams choose KCS</span>
              <ol className="mt-4 divide-y divide-foreground/[0.08]">
                {[
                  { icon: Gift, text: "100% customised hampers & kits" },
                  { icon: Sparkles, text: "Free logo mock-up before you order" },
                  { icon: Headset, text: "Dedicated gifting manager" },
                ].map(({ icon: Icon, text }, index) => (
                  <li key={text} className="flex items-center gap-3 py-3 text-[13.5px] font-medium">
                    <span className="numeral w-6 text-[11px] text-primary">{String(index + 1).padStart(2, "0")}</span>
                    <Icon className="size-4 text-foreground/50" aria-hidden />
                    {text}
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-[12.5px] text-muted-foreground">
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
          <section className="rule-top mt-20 pt-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="kicker text-primary">Keep reading</span>
                <h2 className="display mt-2 text-[1.9rem] md:text-[2.4rem]">More from the journal</h2>
              </div>
              <Button variant="outline" asChild>
                <Link href="/blog">
                  <Newspaper aria-hidden /> All articles
                </Link>
              </Button>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-3">
              {related.map((item) => (
                <BlogTile key={item.id} post={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
