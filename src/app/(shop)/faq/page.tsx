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
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Contents</p>
          <nav aria-label="FAQ sections" className="no-scrollbar mt-3 flex gap-x-5 overflow-x-auto border-b border-foreground/[0.12] pb-1 lg:flex-col lg:gap-0 lg:border-0 lg:overflow-visible">
            {FAQ_SECTIONS.map((section, index) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="group flex shrink-0 items-baseline gap-3 py-2 text-[13.5px] font-semibold text-foreground/80 transition-colors hover:text-primary lg:shrink lg:border-b lg:border-foreground/[0.08] lg:py-3"
              >
                <span className="numeral text-[11px] text-muted-foreground/70 transition-colors group-hover:text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="whitespace-nowrap lg:whitespace-normal">{section.title}</span>
              </a>
            ))}
          </nav>

          <div className="mt-8 hidden rounded-xl bg-brand-ink p-5 text-white lg:block">
            <span className="kicker text-brand-amber">Still stuck?</span>
            <p className="display mt-1.5 text-[1.2rem] leading-snug text-white">Talk to a gifting manager</p>
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
        <div className="space-y-16">
          {FAQ_SECTIONS.map((section, index) => (
            <section key={section.id} id={section.id} className="scroll-mt-28">
              <div className="mb-6 grid gap-4 sm:grid-cols-[4rem_minmax(0,1fr)]">
                <span className="numeral text-[2rem] leading-none text-primary sm:text-[2.5rem]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2 className="display text-[1.75rem] md:text-[2.1rem]">{section.title}</h2>
                  <p className="mt-1.5 text-[14.5px] text-muted-foreground">
                    {section.blurb} <span className="text-foreground/50">· {section.items.length} questions</span>
                  </p>
                </div>
              </div>
              <FaqAccordion items={section.items} sectionId={section.id} />
            </section>
          ))}

          {/* Bottom CTA */}
          <section className="relative overflow-hidden rounded-xl bg-brand-ink px-6 py-10 text-white md:px-12 md:py-14">
            <span aria-hidden className="absolute -top-24 -right-16 size-72 rounded-full bg-primary/30 blur-3xl" />
            <div className="relative grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div className="max-w-xl">
                <span className="kicker text-brand-amber">Didn&apos;t find your answer?</span>
                <h2 className="display mt-3 text-[1.9rem] text-white md:text-[2.4rem]">
                  We reply to every enquiry within a few working hours.
                </h2>
                <p className="mt-3 text-[15px] text-white/75">
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
