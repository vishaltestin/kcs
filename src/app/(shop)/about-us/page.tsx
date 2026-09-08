import type { Metadata } from "next";
import Image from "next/image";
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
      <section className="container mx-auto px-4 py-14 md:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="eyebrow text-primary">Who we are</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
              Gifting that says the right thing, at scale.
            </h2>
            <p className="mt-5 text-muted-foreground">
              KCS G-Mart is one of India&apos;s most trusted corporate gifting companies. We help
              businesses celebrate milestones, welcome new joiners and delight clients through
              thoughtfully curated, brand-customised gifts — delivered pan-India.
            </p>
            <p className="mt-4 text-muted-foreground">
              From premium tech gadgets and drinkware to gourmet hampers and logo-printed apparel,
              our catalogue is built for every budget and every brief. With in-house branding,
              quality checks and dedicated account managers, we make corporate gifting effortless.
            </p>
            <ul className="mt-6 grid gap-2.5 text-sm sm:grid-cols-2">
              {["Tiered bulk pricing", "Dedicated gifting manager", "GST-compliant invoicing", "Sample & mock-up support"].map((t) => (
                <li key={t} className="flex items-center gap-2">
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
            <div aria-hidden className="absolute -inset-4 -z-10 rounded-[2rem] bg-primary/[0.06]" />
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-[0_28px_56px_-28px_rgb(0_0_0/0.5)]">
              <Image
                src={IMAGES.homeGrid.corporate}
                alt="KCS G-Mart corporate gifting"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="absolute -bottom-6 left-6 rounded-2xl bg-card px-5 py-4 shadow-[0_18px_40px_-18px_rgb(0_0_0/0.4)] ring-1 ring-foreground/[0.07]">
              <p className="text-2xl font-extrabold tracking-tight">4.8★</p>
              <p className="text-xs text-muted-foreground">Average client rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative overflow-hidden bg-brand-charcoal py-14 text-white md:py-16">
        <div aria-hidden className="dot-grid absolute inset-0 opacity-40" />
        <div aria-hidden className="absolute -top-32 right-0 size-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="container relative mx-auto grid grid-cols-1 gap-8 px-4 sm:grid-cols-3">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex items-center gap-5 sm:flex-col sm:text-center">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <stat.icon className="size-6 text-brand-amber" aria-hidden />
              </span>
              <div>
                <p className="text-4xl font-extrabold tracking-tight md:text-5xl">{stat.value}</p>
                <p className="mt-1 text-sm text-white/70">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section className="container mx-auto px-4 py-14 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-primary">How we work</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">Three things we never compromise on</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PILLARS.map((p) => (
            <div
              key={p.title}
              className="group rounded-2xl bg-card p-7 ring-1 ring-foreground/[0.07] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-24px_rgb(0_0_0/0.3)]"
            >
              <span className="grid size-12 place-items-center rounded-xl bg-primary/[0.08] text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <p.icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-5 text-lg font-extrabold tracking-tight">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-surface py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow text-primary">Client love</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">What Our Clients Say</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="relative flex h-full flex-col rounded-2xl bg-card p-7 ring-1 ring-foreground/[0.07]">
                <Quote className="size-8 text-primary/25" aria-hidden />
                <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-foreground/85">
                  &ldquo;{t.content}&rdquo;
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t pt-5">
                  <span className="grid size-10 place-items-center rounded-full bg-brand-charcoal text-xs font-bold text-white">
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
