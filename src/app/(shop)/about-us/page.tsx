import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Eye,
  Gift,
  Headset,
  Palette,
  ShieldCheck,
  Sparkles,
  Target,
  Truck,
} from "lucide-react";

import Banner from "@/components/shared/content-banner";
import { FramedImage } from "@/components/shared/framed-image";
import { Button } from "@/components/ui/button";
import { IMAGES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "KCS G-Mart is a corporate gifting and promotional merchandise platform powered by Digital Fueled IT Pvt Ltd — corporate gifts, joining kits, festive hampers and branded merchandise across India.",
};

const OFFERINGS = [
  "Corporate Gifts",
  "Employee Joining Kits",
  "Welcome & Onboarding Kits",
  "Festival & Diwali Hampers",
  "Promotional Merchandise",
  "Customised T-Shirts & Apparel",
  "Branded Drinkware",
  "Tech Gadgets & Accessories",
  "Office & Lifestyle Products",
  "Gourmet & Curated Gift Hampers",
  "Custom Packaging",
  "Logo Printing, Engraving & Embroidery",
  "Bulk Corporate Orders",
  "Custom Gifting Solutions",
];

const WHY_US = [
  {
    icon: Sparkles,
    title: "Curated Products",
    text: "We carefully select products that balance quality, usefulness, presentation, and budget — helping you choose the right gift for every occasion.",
  },
  {
    icon: Palette,
    title: "Custom Branding",
    text: "Your gift should represent your brand. Logo printing, engraving, embroidery, packaging, and customised kits for a professional brand experience.",
  },
  {
    icon: Boxes,
    title: "Bulk & Corporate Orders",
    text: "Built for gifting at scale — from employee onboarding to annual festivals and corporate events, we manage bulk requirements efficiently.",
  },
  {
    icon: ShieldCheck,
    title: "Quality Focused",
    text: "Every order matters. We focus on product quality, branding accuracy, packaging, and fulfilment so gifts arrive in the right condition.",
  },
  {
    icon: Headset,
    title: "Dedicated Support",
    text: "From product selection and quotation to branding and delivery — dedicated assistance across requirements, deadlines, and quantities.",
  },
  {
    icon: Truck,
    title: "Pan-India Fulfilment",
    text: "Logistics support designed for corporate requirements, coordinating deliveries across locations throughout India.",
  },
];

const DIGITAL_FUELED_EXPERTISE = [
  "Web Development",
  "Mobile App Development",
  "SaaS Development",
  "E-commerce",
  "UI/UX Design",
  "Digital Marketing",
  "SEO",
  "AI Automation",
  "Business Technology Solutions",
];

const MORE_THAN_A_GIFT = [
  "It represents appreciation.",
  "It represents recognition.",
  "It represents your brand.",
  "And sometimes, it represents the beginning of a relationship.",
];

export default function AboutUsPage() {
  return (
    <main>
      <Banner
        title="Corporate Gifting, Built for Business"
        eyebrow="About KCS G-Mart"
        subtitle="KCS G-Mart is a corporate gifting and promotional merchandise platform powered by Digital Fueled IT Pvt Ltd — making business gifting simple, reliable, creative, and scalable."
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
              <strong className="font-semibold text-foreground">KCS G-Mart</strong> is a corporate
              gifting and promotional merchandise platform powered by{" "}
              <strong className="font-semibold text-foreground">
                Digital Fueled IT Pvt Ltd
              </strong>
              , created to make business gifting simple, reliable, creative, and scalable.
            </p>
            <p className="mt-4 text-[15.5px] leading-relaxed text-muted-foreground">
              We help businesses, organisations, HR teams, marketing teams, and institutions create
              meaningful experiences through corporate gifts, employee joining kits, promotional
              merchandise, customised products, festive hampers, and branded gifting solutions.
            </p>
            <p className="mt-4 text-[15.5px] leading-relaxed text-muted-foreground">
              Backed by the technology, digital expertise, and business experience of Digital Fueled
              IT Pvt Ltd, we combine creative product curation with a technology-driven approach to
              ordering, customisation, communication, and fulfilment.
            </p>
            <ul className="mt-7 grid gap-x-8 text-[14.5px] sm:grid-cols-2">
              {[
                "Corporate gifts & hampers",
                "Employee joining kits",
                "Custom branding & packaging",
                "Pan-India bulk delivery",
              ].map((t) => (
                <li
                  key={t}
                  className="flex items-center gap-2.5 border-b border-foreground/[0.08] py-2.5"
                >
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
              <p className="display text-[1.35rem] leading-none">Pan-India</p>
              <p className="mt-1.5 text-xs text-muted-foreground">Corporate fulfilment network</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our story */}
      <section className="bg-surface py-14 md:py-20">
        <div className="container max-w-3xl">
          <span className="kicker text-primary">Our story</span>
          <h2 className="display mt-3 text-[2.25rem] md:text-[2.9rem]">
            An extension of a technology ecosystem.
          </h2>
          <p className="mt-6 text-[15.5px] leading-relaxed text-muted-foreground">
            Digital Fueled IT Pvt Ltd is a technology and digital solutions company helping
            startups, SMEs, brands, and enterprises build and grow through web development, mobile
            applications, SaaS platforms, digital marketing, e-commerce, and AI-driven business
            solutions.
          </p>
          <p className="mt-4 text-[15.5px] leading-relaxed text-muted-foreground">
            KCS G-Mart extends this ecosystem into the corporate gifting space, bringing together
            technology, creativity, branding, and reliable fulfilment to provide businesses with a
            single destination for their gifting requirements.
          </p>
          <p className="mt-4 text-[15.5px] leading-relaxed text-muted-foreground">
            From a small employee welcome kit to large-scale corporate gifting campaigns, we focus
            on delivering products that represent your brand and create a memorable experience for
            the recipient.
          </p>
        </div>
      </section>

      {/* What we offer */}
      <section className="container py-14 md:py-20">
        <div className="max-w-2xl">
          <span className="kicker text-primary">What we offer</span>
          <h2 className="display mt-3 text-[2.25rem] md:text-[2.9rem]">
            Everything your gifting programme needs
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Discover and customise a wide range of products for different occasions and
            requirements, including:
          </p>
        </div>
        <ul className="mt-10 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
          {OFFERINGS.map((item) => (
            <li
              key={item}
              className="flex items-center gap-2.5 border-b border-foreground/[0.08] py-3 text-[14.5px] font-medium"
            >
              <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-8 flex items-start gap-2.5 rounded-xl bg-primary/[0.06] px-5 py-4 text-[14.5px] leading-relaxed">
          <Gift className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span>
            Whether you need gifts for <strong>10 employees or thousands of customers and
            employees</strong>, our team works with you to understand your requirement, budget,
            branding guidelines, quantity, and delivery schedule.
          </span>
        </p>
      </section>

      {/* Why KCS G-Mart */}
      <section className="border-y border-foreground/[0.08] bg-surface py-14 md:py-20">
        <div className="container">
          <div className="max-w-2xl">
            <span className="kicker text-primary">Why KCS G-Mart?</span>
            <h2 className="display mt-3 text-[2.25rem] md:text-[2.9rem]">
              Six reasons businesses gift with us
            </h2>
          </div>
          <ol className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
            {WHY_US.map((p, index) => (
              <li key={p.title} className="rule-top pt-6">
                <div className="flex items-center justify-between">
                  <span className="numeral text-[13px] text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p.icon className="size-5 text-foreground/40" aria-hidden />
                </div>
                <h3 className="display mt-5 text-[1.5rem]">{p.title}</h3>
                <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted-foreground">{p.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Powered by Digital Fueled */}
      <section className="relative overflow-hidden bg-brand-ink py-14 text-white md:py-20">
        <span
          aria-hidden
          className="absolute -top-32 right-0 size-96 rounded-full bg-primary/25 blur-3xl"
        />
        <div className="container relative max-w-3xl">
          <span className="kicker text-brand-teal-light">Powered by</span>
          <h2 className="display mt-3 text-[2.25rem] text-white md:text-[2.9rem]">
            Digital Fueled IT Pvt Ltd
          </h2>
          <p className="mt-6 text-[15.5px] leading-relaxed text-white/75">
            KCS G-Mart is backed by Digital Fueled IT Pvt Ltd, a technology and digital solutions
            company established to help businesses embrace digital transformation and growth.
          </p>
          <ul className="mt-7 flex flex-wrap gap-2" aria-label="Digital Fueled expertise">
            {DIGITAL_FUELED_EXPERTISE.map((skill) => (
              <li
                key={skill}
                className="rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[13px] font-medium text-white/90"
              >
                {skill}
              </li>
            ))}
          </ul>
          <p className="mt-7 text-[15px] leading-relaxed text-white/75">
            This technology-first foundation enables KCS G-Mart to continuously improve the
            corporate gifting experience — through better digital platforms, streamlined
            communication, online enquiry management, product discovery, and business automation.
          </p>
        </div>
      </section>

      {/* Mission & vision */}
      <section className="container py-14 md:py-20">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl bg-surface p-7 md:p-9">
            <span className="grid size-11 place-items-center rounded-full bg-primary/10">
              <Target className="size-5 text-primary" aria-hidden />
            </span>
            <h2 className="display mt-5 text-[1.75rem]">Our Mission</h2>
            <p className="display mt-3 text-[1.2rem] leading-snug text-foreground/90">
              &ldquo;To make corporate gifting easier, more creative, more reliable, and more
              meaningful for every business.&rdquo;
            </p>
            <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
              We help organisations strengthen relationships with their employees, customers,
              partners, clients, and communities — through thoughtful gifts and professionally
              branded experiences.
            </p>
          </div>
          <div className="rounded-xl bg-surface p-7 md:p-9">
            <span className="grid size-11 place-items-center rounded-full bg-primary/10">
              <Eye className="size-5 text-primary" aria-hidden />
            </span>
            <h2 className="display mt-5 text-[1.75rem]">Our Vision</h2>
            <p className="display mt-3 text-[1.2rem] leading-snug text-foreground/90">
              &ldquo;To become a trusted corporate gifting and merchandise partner for businesses
              across India.&rdquo;
            </p>
            <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
              By combining quality products, creative customisation, technology, and dependable
              service.
            </p>
          </div>
        </div>
      </section>

      {/* More than a gift */}
      <section className="border-t border-foreground/[0.08] py-14 md:py-20">
        <div className="container max-w-2xl text-center">
          <span className="kicker justify-center text-primary">Our belief</span>
          <h2 className="display mt-3 text-[2.25rem] md:text-[2.9rem]">More than a gift.</h2>
          <p className="mt-4 text-[15px] text-muted-foreground">
            We believe a corporate gift is more than a product.
          </p>
          <ul className="display mt-8 space-y-3 text-[1.5rem] leading-snug text-foreground/90 md:text-[1.75rem]">
            {MORE_THAN_A_GIFT.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="mx-auto mt-8 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            That&apos;s why we focus on creating gifting experiences that people remember.
          </p>
          <p className="display mt-10 text-[1.35rem] tracking-tight">
            Curated. Customised. Branded. Delivered.
          </p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            KCS G-Mart · Powered by Digital Fueled IT Pvt Ltd
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/contact-us">
                Start a Bulk Enquiry <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/product">Explore Gifts</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
