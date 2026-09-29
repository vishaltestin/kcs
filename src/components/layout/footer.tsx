import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Clock,
  Headset,
  Mail,
  PhoneCall,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { NewsletterForm } from "./newsletter-form";
import { IMAGES, SITE } from "@/lib/constants";

const SHOP_LINKS = [
  { label: "All Products", href: "/product" },
  { label: "Shop by Category", href: "/category" },
  { label: "Corporate Gifting", href: "/category/corporate-gifting" },
  { label: "Curated Gift Hampers", href: "/category/curated-gift-hampers" },
  { label: "Joining Kits", href: "/category/joining-kits" },
];

const COMPANY_LINKS = [
  { label: "About Us", href: "/about-us" },
  { label: "Why Choose Us", href: "/why-us" },
  { label: "Our Sellers", href: "/sellers" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/faq" },
];

const SERVICE_LINKS = [
  { label: "Bulk Enquiry", href: "/contact-us" },
  { label: "Book a Meeting", href: "/contact-us" },
  { label: "Contact Us", href: "/contact-us" },
  { label: "Track an Order", href: "/profile?tab=orders" },
];

const ACCOUNT_LINKS = [
  { label: "My Account", href: "/profile" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Cart", href: "/cart" },
  { label: "Become a Member", href: "/signup" },
];

/** Social proof / service promises that sit in the strip above the footer. */
const PROMISES = [
  {
    icon: Truck,
    title: "Pan-India delivery",
    text: "Serving 500+ cities and towns",
  },
  {
    icon: ShieldCheck,
    title: "Quality assured",
    text: "Verified vendors, brand-new stock",
  },
  {
    icon: Clock,
    title: "Quotes in hours",
    text: "Not days — one dedicated manager",
  },
  {
    icon: Headset,
    title: "Bulk & custom",
    text: "Branding, packing, kitting, dispatch",
  },
];

const SOCIALS = [
  { src: IMAGES.socials.facebook, label: "Facebook", href: "#" },
  { src: IMAGES.socials.instagram, label: "Instagram", href: "#" },
  { src: IMAGES.socials.linkedin, label: "LinkedIn", href: "#" },
  { src: IMAGES.socials.whatsapp, label: "WhatsApp", href: "#" },
];

export function Footer() {
  return (
    <footer className="relative mt-24 bg-brand-ink text-white/70">
      {/* Signature rule — mirrors the hairline that caps the sticky nav rail. */}
      <span
        aria-hidden
        className="brand-gradient absolute inset-x-0 top-0 h-[3px]"
      />
      {/* Brand glow: a quiet teal/magenta wash so the ink panel isn't flat. */}
      <span
        aria-hidden
        className="brand-glow pointer-events-none absolute inset-x-0 top-0 h-56 opacity-70"
      />

      {/* ── Service strip ─────────────────────────────────────────────────── */}
      <div className="relative border-b border-white/10">
        <div className="container grid grid-cols-2 lg:grid-cols-4">
          {PROMISES.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="flex items-center gap-3 border-white/10 py-4 pr-3 sm:gap-3.5 sm:px-6 sm:py-5 sm:first:pl-0 lg:px-7 max-lg:[&:nth-child(even)]:border-l max-lg:[&:nth-child(even)]:pl-4 max-lg:[&:nth-child(n+3)]:border-t lg:[&:nth-child(n+2)]:border-l"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/[0.06] ring-1 ring-white/10 sm:size-10">
                <Icon
                  className="size-[18px] text-brand-teal-light"
                  strokeWidth={1.7}
                  aria-hidden
                />
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-white">{title}</p>
                <p className="text-[12.5px] leading-snug text-white/55">
                  {text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main footer ───────────────────────────────────────────────────── */}
      <div className="container relative grid gap-x-10 gap-y-12 py-14 lg:grid-cols-12 lg:py-16">
        {/* Brand block */}
        <div className="pb-2 lg:col-span-4">
          <div className="inline-flex items-center rounded-2xl bg-white p-3 shadow-[0_10px_30px_-16px_rgb(0_0_0/0.6)]">
            <Logo size={104} />
          </div>
          <p className="display mt-6 max-w-sm text-[1.3rem] text-white">
            {SITE.tagline}
          </p>
          <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-white/55">
            Branded gifts, hampers, joining kits and promotional merchandise —
            curated, customised and delivered pan-India.
          </p>

          <div className="mt-7 space-y-3.5 text-[14px]">
            <p className="flex items-center gap-x-3">
              <Mail
                className="size-4 shrink-0 text-brand-magenta-light"
                aria-hidden
              />
              <a
                href={`mailto:${SITE.email}`}
                className="text-white/70 transition-colors hover:text-brand-teal-light"
              >
                {SITE.email}
              </a>
            </p>
            <p className="flex items-center gap-x-3">
              <PhoneCall
                className="size-4 shrink-0 text-brand-magenta-light"
                aria-hidden
              />
              <a
                href={SITE.phoneHref}
                className="text-white/70 transition-colors hover:text-brand-teal-light"
              >
                {SITE.phone}
              </a>
            </p>
          </div>
        </div>

        {/* Link rail */}
        <div className="lg:col-span-8">
          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4"
          >
            {[
              { label: "Shop", links: SHOP_LINKS },
              { label: "Company", links: COMPANY_LINKS },
              { label: "Get in touch", links: SERVICE_LINKS },
              { label: "Account", links: ACCOUNT_LINKS },
            ].map((group) => (
              <div key={group.label}>
                <h3 className="flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-white uppercase">
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 rounded-full bg-brand-teal"
                  />
                  {group.label}
                </h3>
                <ul className="mt-5 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="group/fl inline-flex items-center gap-1 text-[14px] text-white/70 transition-colors hover:text-white"
                      >
                        <span className="border-b border-transparent pb-px transition-colors group-hover/fl:border-brand-magenta">
                          {link.label}
                        </span>
                        <ArrowUpRight
                          className="size-3 translate-y-px opacity-0 transition-all group-hover/fl:translate-y-0 group-hover/fl:opacity-100"
                          aria-hidden
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {/* Newsletter card */}
          <div className="mt-11 rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm sm:p-7">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
              <div>
                <span className="kicker text-brand-teal-light">Newsletter</span>
                <h3 className="display mt-2 text-[1.35rem] text-white">
                  Festival calendar, straight to your inbox
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/55">
                  Gifting trends, festival dates and exclusive bulk offers —
                  once a month, no spam.
                </p>
              </div>
              <div className="footer-newsletter min-w-0 w-full">
                <NewsletterForm />
              </div>
            </div>
          </div>

          {/* Socials */}
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <span className="text-[12px] font-semibold tracking-[0.14em] text-white/40 uppercase">
              Follow us
            </span>
            <span aria-hidden className="h-px w-6 bg-white/15" />
            <div className="flex gap-2.5" aria-label="Social media">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={`KCS G-Mart on ${social.label}`}
                  className="grid size-10 place-items-center rounded-full bg-white/[0.06] ring-1 ring-white/10 transition-colors hover:bg-brand-teal hover:ring-brand-teal"
                >
                  <Image src={social.src} alt="" width={18} height={18} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ────────────────────────────────────────────────────── */}
      <div className="relative border-t border-white/10 bg-black/20">
        <div className="container flex flex-col items-center justify-between gap-4 py-6 lg:flex-row">
          <p className="text-[13px] text-white/50">
            © {new Date().getFullYear()} KCS G-Mart. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div
              className="flex items-center gap-2"
              aria-label="Accepted payment methods"
            >
              {IMAGES.paymentIcons.map((icon, index) => (
                <span
                  key={icon}
                  className="grid h-7 w-11 place-items-center rounded-md bg-white/90"
                >
                  <Image
                    src={icon}
                    width={26}
                    height={26}
                    alt={`Payment method ${index + 1}`}
                    className="max-h-5 w-auto"
                  />
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 text-[13px] text-white/50">
            <span>Corporate Gifting Company · Made in India</span>
            <a
              href="#top"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 font-semibold text-white/70 transition-colors hover:border-brand-teal hover:text-white"
            >
              Back to top
              <ArrowUpRight className="size-3.5 -rotate-45" aria-hidden />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
