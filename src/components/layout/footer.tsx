import Image from "next/image";
import Link from "next/link";
import { Clock, Mail, MapPin, PhoneCall, ShieldCheck, Truck } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { NewsletterForm } from "./newsletter-form";
import { IMAGES, SITE } from "@/lib/constants";

const COMPANY_LINKS = [
  { label: "About Us", href: "/about-us" },
  { label: "Why Choose Us", href: "/why-us" },
  { label: "Blog", href: "/blog" },
  { label: "Contact Us", href: "/contact-us" },
  { label: "FAQ", href: "/faq" },
];

const SHOP_LINKS = [
  { label: "All Products", href: "/product" },
  { label: "Corporate Gifting", href: "/category/corporate-gifting" },
  { label: "Bulk Enquiry", href: "/contact-us" },
  { label: "Book a Meeting", href: "/contact-us" },
];

const ACCOUNT_LINKS = [
  { label: "My Account", href: "/profile" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Cart", href: "/cart" },
  { label: "Become a Member", href: "/signup" },
];

export function Footer() {
  return (
    <footer className="mt-24 bg-brand-ink text-white/75">
      {/* Trust strip */}
      <div className="border-b border-white/10">
        <div className="container grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            { icon: Truck, title: "Pan-India delivery", text: "Serving 500+ cities and towns" },
            { icon: ShieldCheck, title: "Quality assured", text: "Verified vendors, brand-new stock" },
            { icon: Clock, title: "Fast responses", text: "Quotes within a few hours" },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-4 py-6 sm:px-8 sm:first:pl-0 sm:last:pr-0">
              <Icon className="size-5 shrink-0 text-brand-amber" strokeWidth={1.7} aria-hidden />
              <div>
                <p className="text-[14.5px] font-semibold text-white">{title}</p>
                <p className="text-[13px] text-white/55">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main footer */}
      <div className="container grid gap-12 py-14 lg:grid-cols-12 lg:py-16">
        {/* Brand */}
        <div className="lg:col-span-4">
          <div className="inline-block rounded-xl bg-white p-3">
            <Logo size={110} />
          </div>
          <p className="display mt-6 max-w-sm text-[1.35rem] text-white">{SITE.tagline}</p>
          <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-white/55">
            Branded gifts, hampers, joining kits and promotional merchandise — curated, customised and delivered
            pan-India.
          </p>

          <div className="mt-7 space-y-3 text-[14px]">
            <p className="flex gap-x-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand-amber" aria-hidden />
              <span>{SITE.address}</span>
            </p>
            <p className="flex items-center gap-x-3">
              <Mail className="size-4 shrink-0 text-brand-amber" aria-hidden />
              <a href={`mailto:${SITE.email}`} className="transition-colors hover:text-white">
                {SITE.email}
              </a>
            </p>
            <p className="flex items-center gap-x-3">
              <PhoneCall className="size-4 shrink-0 text-brand-amber" aria-hidden />
              <a href={SITE.phoneHref} className="transition-colors hover:text-white">
                78381 52753
              </a>
            </p>
          </div>

          <div className="mt-7 flex gap-2.5" aria-label="Social media">
            {[
              { src: IMAGES.socials.facebook, label: "Facebook" },
              { src: IMAGES.socials.instagram, label: "Instagram" },
              { src: IMAGES.socials.linkedin, label: "LinkedIn" },
              { src: IMAGES.socials.whatsapp, label: "WhatsApp" },
            ].map((social) => (
              <a
                key={social.label}
                href="#"
                aria-label={`KCS G-Mart on ${social.label}`}
                className="grid size-10 place-items-center rounded-full bg-white/[0.06] ring-1 ring-white/10 transition-colors hover:bg-white hover:ring-white"
              >
                <Image src={social.src} alt="" width={20} height={20} />
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:col-span-8 lg:pl-12">
          {[
            { label: "Company", links: COMPANY_LINKS },
            { label: "Shop", links: SHOP_LINKS },
            { label: "Account", links: ACCOUNT_LINKS },
          ].map((group) => (
            <nav key={group.label} aria-label={group.label} className="last:col-span-2 sm:last:col-span-1">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">{group.label}</h3>
              <ul className="mt-5 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[14.5px] text-white/80 transition-colors hover:text-white hover:underline hover:decoration-brand-amber hover:underline-offset-4"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Newsletter */}
          <div className="col-span-2 border-t border-white/10 pt-8 sm:col-span-3">
            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-center">
              <div>
                <h3 className="display text-[1.5rem] text-white">Stay in the loop</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/55">
                  Gifting trends, festival calendars and exclusive bulk offers — once a month, no spam.
                </p>
              </div>
              <div className="footer-newsletter">
                <NewsletterForm />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="text-[13px] text-white/50">© {new Date().getFullYear()} KCS G-Mart. All rights reserved.</p>
          <div className="flex items-center gap-3" aria-label="Accepted payment methods">
            {IMAGES.paymentIcons.map((icon, index) => (
              <span key={icon} className="grid h-7 w-11 place-items-center rounded-md bg-white/90">
                <Image src={icon} width={26} height={26} alt={`Payment method ${index + 1}`} className="max-h-5 w-auto" />
              </span>
            ))}
          </div>
          <p className="text-[13px] text-white/50">Corporate Gifting Company · Made in India</p>
        </div>
      </div>
    </footer>
  );
}
