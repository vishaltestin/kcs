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
    <footer className="mt-16 border-t bg-muted/40">
      {/* Trust strip */}
      <div className="border-b bg-background">
        <div className="container grid grid-cols-1 gap-6 py-8 sm:grid-cols-3">
          {[
            { icon: Truck, title: "Pan-India Delivery", text: "Serving 500+ cities and towns" },
            { icon: ShieldCheck, title: "Quality Assured", text: "Verified vendors, brand-new stock" },
            { icon: Clock, title: "Fast Responses", text: "Quotes within a few hours" },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-6" aria-hidden />
              </span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main footer */}
      <div className="container grid gap-12 py-14 lg:grid-cols-12">
        {/* Brand */}
        <div className="lg:col-span-4">
          <Logo size={130} />
          <p className="mt-5 max-w-sm leading-relaxed text-muted-foreground">{SITE.tagline}</p>

          <div className="mt-6 space-y-3 text-sm text-muted-foreground">
            <p className="flex gap-x-3">
              <MapPin className="mt-0.5 size-4.5 shrink-0 text-primary" size={18} aria-hidden />
              <span>{SITE.address}</span>
            </p>
            <p className="flex items-center gap-x-3">
              <Mail className="size-4.5 shrink-0 text-primary" size={18} aria-hidden />
              <a href={`mailto:${SITE.email}`} className="transition-colors hover:text-primary">
                {SITE.email}
              </a>
            </p>
            <p className="flex items-center gap-x-3">
              <PhoneCall className="size-4.5 shrink-0 text-primary" size={18} aria-hidden />
              <a href={SITE.phoneHref} className="transition-colors hover:text-primary">
                78381 52753
              </a>
            </p>
          </div>

          <div className="mt-7 flex gap-3" aria-label="Social media">
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
                className="grid size-11 place-items-center rounded-xl border bg-background transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <Image src={social.src} alt="" width={22} height={22} />
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-8 lg:pl-10">
          <nav aria-label="Company">
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Company</h3>
            <ul className="mt-5 space-y-3">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Shop">
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Shop</h3>
            <ul className="mt-5 space-y-3">
              {SHOP_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Account" className="col-span-2 sm:col-span-1">
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Account</h3>
            <ul className="mt-5 space-y-3">
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Newsletter */}
          <div className="col-span-2 sm:col-span-3">
            <div className="rounded-2xl border bg-background p-6 sm:p-7">
              <h3 className="text-lg font-bold tracking-tight">Stay in the loop</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Gifting trends, festival calendars and exclusive bulk offers — once a month, no spam.
              </p>
              <div className="mt-5">
                <NewsletterForm />
              </div>
              <div className="mt-5 flex items-center gap-4 border-t pt-5" aria-label="Accepted payment methods">
                {IMAGES.paymentIcons.map((icon, index) => (
                  <Image
                    key={icon}
                    src={icon}
                    width={32}
                    height={32}
                    alt={`Payment method ${index + 1}`}
                    className="opacity-80"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t">
        <div className="container flex flex-col items-center justify-between gap-3 py-6 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} KCS G-Mart. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Corporate Gifting Company · Made in India
          </p>
        </div>
      </div>
    </footer>
  );
}
