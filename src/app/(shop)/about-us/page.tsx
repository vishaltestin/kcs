import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  Briefcase,
  CheckCircle2,
  Palette,
  Quote,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";

import Banner from "@/components/shared/content-banner";
import { FramedImage } from "@/components/shared/framed-image";
import { Button } from "@/components/ui/button";
import { IMAGES } from "@/lib/constants";
import { initials } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "KCS G-Mart is a corporate gifting company delivering branded gifts, hampers and joining kits across India.",
};

const TESTIMONIALS = [
  {
    name: "Alice Johnson",
    role: "CEO, TechCorp",
    content:
      "Working with this team has been an absolute pleasure. They delivered beyond our expectations!",
  },
  {
    name: "Bob Smith",
    role: "CTO, InnovateCo",
    content:
      "The level of expertise and professionalism is unmatched. Highly recommended!",
  },
  {
    name: "Carol White",
    role: "HR Director, GlobalSoft",
    content:
      "Our onboarding kits arrived on time and the quality was fantastic. New hires loved them.",
  },
];

const STATS = [
  { icon: Users, value: "500+", label: "Happy Clients" },
  { icon: Briefcase, value: "1000+", label: "Projects Delivered" },
  { icon: Award, value: "50+", label: "Awards & Recognitions" },
];

const PILLARS = [
  { icon: Palette, title: "In-house branding", text: "Logo print, engraving, embroidery and bespoke packaging under one roof." },
  { icon: ShieldCheck, title: "Quality checked", text: "Every unit inspected before it leaves; genuine brand stock with warranty." },
  { icon: Truck, title: "Pan-India logistics", text: "Desk-drop, doorstep or campus delivery to 19,000+ PIN codes." },
];

export default function AboutUsPage() {
  return (
    <main>
      <Banner
        title="About Us"
        eyebrow="Our story"
        subtitle="One of India's most trusted corporate gifting partners — built on craft, speed and care."
        crumbs={[{ label: "Home", href: "/" }, { label: "About Us" }]}
      />

      {/* Who we are */}
      <section className="container py-14 md:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <span className="kicker text-primary">Who we are</span>
            <h2 className="display mt-3 text-[2.25rem] md:text-[2.9rem]">
              Gifting that says the right thing, at scale.
            </h2>
            <p className="mt-6 text-[15.5px] leading-relaxed text-muted-foreground">
              KCS G-Mart is one of India&apos;s most trusted corporate gifting companies. We help
              businesses celebrate milestones, welcome new joiners and delight clients through
              thoughtfully curated, brand-customised gifts — delivered pan-India.
            </p>
            <p className="mt-4 text-[15.5px] leading-relaxed text-muted-foreground">
              From premium tech gadgets and drinkware to gourmet hampers and logo-printed apparel,
              our catalogue is built for every budget and every brief. With in-house branding,
              quality checks and dedicated account managers, we make corporate gifting effortless.
            </p>
            <ul className="mt-7 grid gap-x-8 text-[14.5px] sm:grid-cols-2">
              {["Tiered bulk pricing", "Dedicated gifting manager", "GST-compliant invoicing", "Sample & mock-up support"].map((t) => (
                <li key={t} className="flex items-center gap-2.5 border-b border-foreground/[0.08] py-2.5">
                  <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/contact-us">
                  Work With Us <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/product">Browse the catalogue</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <FramedImage
              src={IMAGES.homeGrid.corporate}
              alt="KCS G-Mart corporate gifting"
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="aspect-[4/3] rounded-xl shadow-[inset_0_0_0_1px_rgb(17_24_39/0.06)]"
            />
            <div className="absolute -bottom-6 left-6 rounded-lg bg-background px-5 py-4 shadow-[0_18px_40px_-18px_rgb(0_0_0/0.35)]">
              <p className="numeral text-[2rem] leading-none">4.8★</p>
              <p className="mt-1.5 text-xs text-muted-foreground">Average client rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative overflow-hidden bg-brand-ink py-14 text-white md:py-16">
        <span aria-hidden className="absolute -top-32 right-0 size-96 rounded-full bg-primary/25 blur-3xl" />
        <div className="container relative grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {STATS.map((stat, index) => (
            <div key={stat.label} className="flex items-start gap-5 py-6 sm:px-8 sm:py-2 sm:first:pl-0 sm:last:pr-0">
              <span className="numeral pt-1 text-[12px] text-brand-amber">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <p className="numeral text-[3rem] leading-none md:text-[3.5rem]">{stat.value}</p>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-white/70">
                  <stat.icon className="size-3.5 text-brand-amber" aria-hidden /> {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section className="container py-14 md:py-20">
        <div className="max-w-2xl">
          <span className="kicker text-primary">How we work</span>
          <h2 className="display mt-3 text-[2.25rem] md:text-[2.9rem]">Three things we never compromise on</h2>
        </div>
        <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
          {PILLARS.map((p, index) => (
            <li key={p.title} className="rule-top pt-6">
              <div className="flex items-center justify-between">
                <span className="numeral text-[13px] text-primary">{String(index + 1).padStart(2, "0")}</span>
                <p.icon className="size-5 text-foreground/40" aria-hidden />
              </div>
              <h3 className="display mt-5 text-[1.5rem]">{p.title}</h3>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted-foreground">{p.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Testimonials */}
      <section className="bg-surface py-14 md:py-20">
        <div className="container">
          <div className="max-w-2xl">
            <span className="kicker text-primary">Client love</span>
            <h2 className="display mt-3 text-[2.25rem] md:text-[2.9rem]">What Our Clients Say</h2>
          </div>
          <div className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="relative flex h-full flex-col">
                <Quote className="size-7 text-primary" aria-hidden />
                <blockquote className="display mt-4 flex-1 text-[1.25rem] leading-[1.45]! text-foreground/90">
                  &ldquo;{t.content}&rdquo;
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-foreground/[0.12] pt-5">
                  <span className="display grid size-10 place-items-center rounded-full bg-brand-ink text-[13px] text-white">
                    {initials(t.name)}
                  </span>
                  <div>
                    <p className="text-sm font-bold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
