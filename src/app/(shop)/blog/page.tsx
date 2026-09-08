import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Newspaper, PenLine } from "lucide-react";

import { PaginationControls } from "@/components/shared/pagination-controls";
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
      {/* Header */}
      <div className="border-b bg-surface/70">
        <div className="container mx-auto px-4 pt-7 pb-8 md:pt-9 md:pb-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="eyebrow text-primary">Insights &amp; guides</p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">From the Blog</h1>
              <p className="mt-2 text-muted-foreground">
                Gifting trends, onboarding-kit playbooks and festival calendars — written by the team
                that ships them.
              </p>
            </div>
            <p className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold ring-1 ring-foreground/[0.07]">
              <Newspaper className="size-4 text-primary" aria-hidden />
              {total} {total === 1 ? "article" : "articles"}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 md:py-12">
        {posts.length === 0 ? (
          <EmptyState
            icon={Newspaper}
            title="No blog posts yet"
            description="We're writing fresh corporate gifting insights — check back soon."
          />
        ) : (
          <>
            {showLead && (
              <article className="group/lead mb-10 grid overflow-hidden rounded-3xl bg-card ring-1 ring-foreground/[0.07] shadow-[0_28px_56px_-32px_rgb(0_0_0/0.4)] lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
                <Link href={`/blog/${lead.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-muted lg:aspect-auto lg:min-h-[26rem]">
                  <Image
                    src={lead.image}
                    alt={lead.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/lead:scale-[1.04]"
                  />
                  <span className="absolute top-4 left-4 rounded-md bg-primary px-2.5 py-1 text-[10px] font-bold tracking-wide text-primary-foreground uppercase">
                    Latest
                  </span>
                </Link>
                <div className="flex flex-col justify-center p-7 md:p-10">
                  <p className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-3.5" aria-hidden /> {formatDate(lead.publishedAt)}
                    </span>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <PenLine className="size-3.5" aria-hidden /> {lead.author}
                    </span>
                  </p>
                  <h2 className="mt-3 text-2xl font-extrabold tracking-tight md:text-3xl">
                    <Link href={`/blog/${lead.slug}`} className="transition-colors hover:text-primary">
                      {lead.title}
                    </Link>
                  </h2>
                  <p className="mt-3 line-clamp-3 text-muted-foreground">{lead.excerpt}</p>
                  <Button asChild className="mt-6 w-fit" size="lg">
                    <Link href={`/blog/${lead.slug}`}>
                      Read article <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                </div>
              </article>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
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
        <section className="relative mt-14 overflow-hidden rounded-3xl bg-brand-charcoal px-6 py-10 text-white md:px-12 md:py-12">
          <div aria-hidden className="dot-grid absolute inset-0 opacity-40" />
          <div aria-hidden className="absolute -top-24 -right-24 size-72 rounded-full bg-primary/40 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-xl">
              <p className="eyebrow text-brand-amber">Put the ideas to work</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl">
                Ready to brief a gifting manager?
              </h2>
              <p className="mt-2 text-sm text-white/70">
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
