import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bot, GraduationCap, Headset, Truck } from "lucide-react";

import Banner from "@/components/shared/content-banner";
import { FramedImage } from "@/components/shared/framed-image";
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
      <div className="container">
        <div className="no-scrollbar flex items-center gap-x-6 overflow-x-auto border-b border-foreground/[0.12]">
          <span className="shrink-0 py-4 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">Our services</span>
          {SERVICES.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="relative inline-flex shrink-0 items-center gap-2 py-4 text-[13.5px] font-semibold text-foreground/80 transition-colors after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-primary after:opacity-0 after:transition-opacity hover:text-primary hover:after:opacity-100"
            >
              <span className="numeral text-[11px] text-primary">{s.index}</span>
              {s.title}
            </a>
          ))}
        </div>
      </div>

      <section className="container py-14 md:py-20">
        <div className="max-w-2xl">
          <span className="kicker text-primary">What sets us apart</span>
          <h2 className="display mt-3 text-[2.25rem] md:text-[3.25rem]">Our Services</h2>
        </div>

        <div className="mt-12 space-y-16 md:mt-16 md:space-y-24">
          {SERVICES.map((s, i) => {
            const flip = i % 2 === 0;
            return (
              <article
                key={s.id}
                id={s.id}
                className="rule-top grid scroll-mt-28 items-center gap-8 pt-8 md:grid-cols-2 md:gap-14 md:pt-10"
              >
                <div className={cn(flip && "md:order-2")}>
                  <div className="flex items-center justify-between">
                    <span className="numeral text-[2.5rem] leading-none text-primary">{s.index}</span>
                    <s.icon className="size-6 text-foreground/40" aria-hidden />
                  </div>
                  <h3 className="display mt-6 text-[1.9rem] md:text-[2.4rem]">{s.title}</h3>
                  <p className="kicker mt-2 text-primary">{s.lead}</p>
                  <p className="mt-5 text-[15.5px] leading-relaxed text-muted-foreground">{s.body}</p>
                  <ul className="mt-6 divide-y divide-foreground/[0.08] border-y border-foreground/[0.08]">
                    {s.bullets.map((b, bi) => (
                      <li key={b} className="flex items-baseline gap-3 py-2.5 text-[14px] font-medium text-foreground/85">
                        <span className="numeral text-[11px] text-muted-foreground/70">{s.index}.{bi + 1}</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={cn("relative", flip && "md:order-1")}>
                  <FramedImage
                    src={s.image}
                    alt={s.alt}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="aspect-[3/2] rounded-xl shadow-[inset_0_0_0_1px_rgb(17_24_39/0.06)]"
                  />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-16 md:pb-20">
        <div className="relative overflow-hidden rounded-xl bg-brand-ink px-6 py-10 text-white md:px-12 md:py-14">
          <span aria-hidden className="absolute -top-24 -right-24 size-72 rounded-full bg-primary/30 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-xl">
              <span className="kicker text-brand-amber">Experience it first-hand</span>
              <h2 className="display mt-3 text-[1.9rem] text-white md:text-[2.4rem]">
                Let&apos;s plan your next gifting drive.
              </h2>
              <p className="mt-3 text-[15px] text-white/70">
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
