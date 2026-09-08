import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bot, GraduationCap, Headset, Truck } from "lucide-react";

import Banner from "@/components/shared/content-banner";
import { Button } from "@/components/ui/button";
import { IMAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Why Choose Us",
  description:
    "Automation, prompt sales support, training & development and last-mile delivery — the KCS G-Mart advantage.",
};

const SERVICES = [
  {
    id: "automation",
    icon: Bot,
    index: "01",
    title: "Automation",
    lead: "Processes that run like clockwork.",
    body:
      "We employ advanced automation across every facet of our operations, from implementing innovative loyalty reward programs to optimizing our delivery systems and streamlining inventory management. This comprehensive automation ensures that our processes operate seamlessly, consistently delivering a remarkable experience that exceeds expectations for both our partners and associates.",
    image: IMAGES.whyUs.automation,
    alt: "Automation driven gifting operations",
    bullets: ["Loyalty & reward programme engines", "Real-time inventory sync", "Automated dispatch tracking"],
  },
  {
    id: "sales",
    icon: Headset,
    index: "02",
    title: "Prompt Sales Support",
    lead: "Hours, not days.",
    body:
      "Our gifting managers respond within hours, not days. From first enquiry to final delivery, a dedicated point of contact keeps you updated at every step — with quick quotes, mockups and samples.",
    image: IMAGES.whyUs.promptSales,
    alt: "Prompt sales support",
    bullets: ["Dedicated account manager", "Same-day quotations", "Mock-ups & physical samples"],
  },
  {
    id: "training",
    icon: GraduationCap,
    index: "03",
    title: "Training & Development",
    lead: "Experts on every call.",
    body:
      "We invest heavily in our people. Every team member is trained on product knowledge, branding techniques and client etiquette, so you always deal with experts who understand corporate gifting end-to-end.",
    image: IMAGES.whyUs.training,
    alt: "Training and development",
    bullets: ["Product & branding know-how", "Client etiquette training", "Continuous upskilling"],
  },
  {
    id: "delivery",
    icon: Truck,
    index: "04",
    title: "Last-Mile Delivery",
    lead: "19,000+ PIN codes, gift-wrapped.",
    body:
      "With warehousing partners across metros and a robust last-mile network, we deliver to offices, campuses and homes in 19,000+ pin codes — individually gift-wrapped and quality-checked.",
    image: IMAGES.whyUs.lmd,
    alt: "Last mile delivery services",
    bullets: ["Metro warehousing partners", "Individual gift-wrapping", "Quality check before dispatch"],
  },
];

export default function WhyUsPage() {
  return (
    <main>
      <Banner
        title="Why Choose Us"
        eyebrow="The KCS G-Mart advantage"
        subtitle="Automation, responsive people and a delivery network that reaches every corner of India."
        crumbs={[{ label: "Home", href: "/" }, { label: "Why Us" }]}
      />

      {/* Quick nav */}
      <div className="border-b bg-surface/70">
        <div className="container mx-auto flex flex-wrap items-center gap-2 px-4 py-4">
          <span className="mr-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Our services</span>
          {SERVICES.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3.5 py-1.5 text-[13px] font-semibold transition-colors hover:border-primary/40 hover:text-primary"
            >
              <s.icon className="size-3.5 text-primary" aria-hidden />
              {s.title}
            </a>
          ))}
        </div>
      </div>

      <section className="container mx-auto px-4 py-14 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-primary">What sets us apart</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight md:text-5xl">Our Services</h2>
        </div>

        <div className="mt-12 space-y-16 md:mt-16 md:space-y-24">
          {SERVICES.map((s, i) => {
            const flip = i % 2 === 0;
            return (
              <article
                key={s.id}
                id={s.id}
                className="grid scroll-mt-28 items-center gap-8 md:grid-cols-2 md:gap-14"
              >
                <div className={cn(flip && "md:order-2")}>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-extrabold tracking-tight text-primary/20">{s.index}</span>
                    <span className="grid size-11 place-items-center rounded-xl bg-primary/[0.08] text-primary">
                      <s.icon className="size-5" aria-hidden />
                    </span>
                  </div>
                  <h3 className="mt-4 text-2xl font-extrabold tracking-tight md:text-3xl">{s.title}</h3>
                  <p className="mt-1 text-base font-semibold text-primary">{s.lead}</p>
                  <p className="mt-4 text-muted-foreground">{s.body}</p>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {s.bullets.map((b) => (
                      <li key={b} className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-foreground/80">
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={cn("relative", flip && "md:order-1")}>
                  <div
                    aria-hidden
                    className={cn(
                      "absolute -inset-3 -z-10 rounded-[1.75rem] bg-primary/[0.05]",
                      flip ? "-rotate-1" : "rotate-1"
                    )}
                  />
                  <div className="relative aspect-[3/2] overflow-hidden rounded-3xl shadow-[0_28px_56px_-28px_rgb(0_0_0/0.5)]">
                    <Image
                      src={s.image}
                      alt={s.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-16 md:pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-brand-charcoal px-6 py-10 text-white md:px-12 md:py-14">
          <div aria-hidden className="dot-grid absolute inset-0 opacity-40" />
          <div aria-hidden className="absolute -top-24 -right-24 size-72 rounded-full bg-primary/40 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-xl">
              <p className="eyebrow text-brand-amber">Experience it first-hand</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl">
                Let&apos;s plan your next gifting drive.
              </h2>
              <p className="mt-2 text-sm text-white/70">
                Tell us the occasion, headcount and budget — we&apos;ll come back with a curated shortlist.
              </p>
            </div>
            <Button asChild size="xl">
              <Link href="/contact-us">
                Get a quotation <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
