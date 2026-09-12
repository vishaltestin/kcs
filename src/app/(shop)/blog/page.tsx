import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Newspaper, PenLine } from "lucide-react";

import { PaginationControls } from "@/components/shared/pagination-controls";
import { FramedImage } from "@/components/shared/framed-image";
import { EmptyState } from "@/components/shared/empty-state";
import { BlogTile } from "@/components/shared/carousels";
import { Button } from "@/components/ui/button";
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
  const rawPage = Math.floor(Number((Array.isArray(pageParam) ? pageParam[0] : pageParam) ?? "1"));
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.min(rawPage, 10_000) : 1;

  const { items: posts, totalPages, total } = await getBlogPosts(page, 9);
  const [lead, ...rest] = posts;
  const showLead = page === 1 && lead;

  return (
    <div>
      {/* Masthead */}
      <div className="container pt-8 md:pt-12">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-foreground/[0.12] pb-8">
          <div className="max-w-2xl">
            <span className="kicker text-primary">Insights &amp; guides</span>
            <h1 className="display mt-2 text-[2.5rem] md:text-[3.5rem]">The Gifting Journal</h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              Gifting trends, onboarding-kit playbooks and festival calendars — written by the team
              that ships them.
            </p>
          </div>
          <dl className="flex items-baseline gap-2">
            <dt className="sr-only">Articles</dt>
            <dd className="numeral text-[2.5rem] leading-none">{total}</dd>
            <dd className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Newspaper className="size-3.5 text-primary" aria-hidden />
              {total === 1 ? "article" : "articles"}
            </dd>
          </dl>
        </div>
      </div>

      <div className="container py-10 md:py-12">
        {posts.length === 0 ? (
          <EmptyState
            icon={Newspaper}
            title="No blog posts yet"
            description="We're writing fresh corporate gifting insights — check back soon."
          />
        ) : (
          <>
            {showLead && (
              <article className="group/lead mb-14 grid gap-6 border-b border-foreground/[0.12] pb-14 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-12">
                <Link href={`/blog/${lead.slug}`} className="block">
                  <FramedImage
                    src={lead.image}
                    alt={lead.title}
                    priority
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    quality={85}
                    className="aspect-[16/10] rounded-xl shadow-[inset_0_0_0_1px_rgb(17_24_39/0.06)]"
                    imgClassName="transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/lead:scale-[1.03]"
                  />
                </Link>
                <div className="flex flex-col justify-center">
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    <span className="text-primary">Latest</span>
                    <span aria-hidden className="h-px w-6 bg-foreground/20" />
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-3.5" aria-hidden /> {formatDate(lead.publishedAt)}
                    </span>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
                      <PenLine className="size-3.5" aria-hidden /> {lead.author}
                    </span>
                  </p>
                  <h2 className="display mt-4 text-[1.9rem] leading-[1.15] md:text-[2.5rem]">
                    <Link href={`/blog/${lead.slug}`} className="transition-colors hover:text-primary">
                      {lead.title}
                    </Link>
                  </h2>
                  <p className="mt-4 line-clamp-3 text-[15px] leading-relaxed text-muted-foreground">{lead.excerpt}</p>
                  <Button asChild className="mt-7 w-fit" size="lg">
                    <Link href={`/blog/${lead.slug}`}>
                      Read article <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                </div>
              </article>
            )}

            <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
              {(showLead ? rest : posts).map((post) => (
                <BlogTile
                  key={post.id}
                  post={{
                    id: post.id,
                    title: post.title,
                    slug: post.slug,
                    excerpt: post.excerpt,
                    image: post.image,
                    publishedAt: post.publishedAt.toISOString(),
                    author: post.author,
                  }}
                />
              ))}
            </div>
          </>
        )}

        <PaginationControls page={page} totalPages={totalPages} basePath="/blog" />

        {/* CTA */}
        <section className="relative mt-16 overflow-hidden rounded-xl bg-brand-ink px-6 py-10 text-white md:px-12 md:py-14">
          <span aria-hidden className="absolute -top-24 -right-24 size-72 rounded-full bg-primary/30 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-xl">
              <span className="kicker text-brand-amber">Put the ideas to work</span>
              <h2 className="display mt-3 text-[1.9rem] text-white md:text-[2.4rem]">
                Ready to brief a gifting manager?
              </h2>
              <p className="mt-3 text-[15px] text-white/70">
                Share your headcount, budget and timeline — we&apos;ll send a curated shortlist within a business day.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="xl">
                <Link href="/contact-us">
                  Start a brief <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild size="xl" variant="glass">
                <Link href="/product">Browse products</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
