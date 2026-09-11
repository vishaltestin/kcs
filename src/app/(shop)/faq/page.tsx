import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Headset, MessageCircle, PhoneCall } from "lucide-react";

import Banner from "@/components/shared/content-banner";
import { FaqAccordion } from "@/components/shared/faq-accordion";
import { BookMeetingButton } from "@/components/book-a-meeting/book-meeting-button";
import { Button } from "@/components/ui/button";
import { FAQ_SECTIONS } from "@/lib/faq";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "FAQ — Corporate Gifting Questions Answered",
  description:
    "Answers on minimum order quantities, bulk pricing, logo branding, mock-ups, delivery timelines, GST invoicing and returns at KCS G-Mart.",
};

export default function FaqPage() {
  const total = FAQ_SECTIONS.reduce((sum, s) => sum + s.items.length, 0);

  // FAQPage structured data so Google can show rich results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_SECTIONS.flatMap((section) =>
      section.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      }))
    ),
  };

  return (
    <div className="pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Banner
        eyebrow="Help centre"
        title="Frequently Asked Questions"
        subtitle={`${total} straight answers on ordering, branding, delivery, payments and support.`}
        crumbs={[{ label: "Home", href: "/" }, { label: "FAQ" }]}
      />

      <div className="container mt-10 grid gap-10 md:mt-12 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
        {/* Section nav */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow text-muted-foreground">Browse by topic</p>
          <nav aria-label="FAQ sections" className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar lg:flex-col lg:overflow-visible">
            {FAQ_SECTIONS.map((section, index) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="group flex shrink-0 items-center gap-3 rounded-xl bg-card px-3.5 py-2.5 text-[13px] font-semibold ring-1 ring-foreground/[0.07] transition-colors hover:bg-primary hover:text-primary-foreground hover:ring-primary lg:shrink"
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary/[0.08] text-[11px] font-bold text-primary tabular-nums group-hover:bg-white/20 group-hover:text-white">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="whitespace-nowrap lg:whitespace-normal">{section.title}</span>
              </a>
            ))}
          </nav>

          <div className="mt-8 hidden rounded-2xl bg-brand-charcoal p-5 text-white lg:block">
            <p className="eyebrow text-brand-amber">Still stuck?</p>
            <p className="mt-1.5 text-[15px] font-bold leading-snug">Talk to a gifting manager</p>
            <p className="mt-1 text-xs text-white/70">Mon–Sat, 10 am – 7 pm IST</p>
            <div className="mt-4 grid gap-2">
              <Button asChild size="sm" className="justify-start">
                <a href={SITE.phoneHref}>
                  <PhoneCall aria-hidden /> {SITE.phone}
                </a>
              </Button>
              <BookMeetingButton variant="glass" size="sm" label="Book a video call" className="justify-start" />
            </div>
          </div>
        </aside>

        {/* Sections */}
        <div className="space-y-12">
          {FAQ_SECTIONS.map((section, index) => (
            <section key={section.id} id={section.id} className="scroll-mt-28">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="eyebrow text-primary">
                    {String(index + 1).padStart(2, "0")} · {section.items.length} questions
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold tracking-tight md:text-[1.7rem]">{section.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{section.blurb}</p>
                </div>
              </div>
              <FaqAccordion items={section.items} sectionId={section.id} />
            </section>
          ))}

          {/* Bottom CTA */}
          <section className="relative overflow-hidden rounded-3xl bg-brand-charcoal px-6 py-10 text-white md:px-12 md:py-12">
            <div aria-hidden className="dot-grid absolute inset-0 opacity-40" />
            <span aria-hidden className="absolute -top-24 -right-16 size-72 rounded-full bg-primary/25 blur-3xl" />
            <div className="relative grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div className="max-w-xl">
                <p className="eyebrow text-brand-amber">Didn&apos;t find your answer?</p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl">
                  We reply to every enquiry within a few working hours.
                </h2>
                <p className="mt-3 text-sm text-white/75 md:text-base">
                  Share your quantity, budget and timeline — you&apos;ll get curated options, a logo mock-up and a formal
                  quotation from a dedicated gifting manager.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
                <Button asChild size="xl">
                  <Link href="/contact-us">
                    <Headset aria-hidden /> Contact us <ArrowRight aria-hidden />
                  </Link>
                </Button>
                <Button asChild size="xl" variant="glass">
                  <a
                    href={`https://wa.me/917838152753?text=${encodeURIComponent("Hi KCS G-Mart, I have a question about corporate gifting.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle aria-hidden /> WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
