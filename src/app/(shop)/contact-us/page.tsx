import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageSquareText, Phone, Zap } from "lucide-react";

import Banner from "@/components/shared/content-banner";
import { ContactForm } from "@/components/forms/contact-form";
import { BookMeetingButton } from "@/components/book-a-meeting/book-meeting-button";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with KCS G-Mart for corporate gifting, bulk enquiries and quick quotations.",
};

const CHANNELS = [
  {
    icon: Phone,
    title: "Phone",
    body: "+91 78381 52753",
    href: SITE.phoneHref,
    note: "Mon–Sat, 10am–7pm IST",
  },
  {
    icon: Mail,
    title: "Email",
    body: SITE.email,
    href: `mailto:${SITE.email}`,
    note: "Replies within one business day",
  },
  {
    icon: MapPin,
    title: "Office",
    body: SITE.address,
    note: "Visits by appointment",
  },
  {
    icon: Clock,
    title: "Business hours",
    body: "Monday – Saturday",
    note: "10:00 AM – 7:00 PM IST",
  },
];

export default function ContactUsPage() {
  return (
    <>
      <Banner
        title="Contact Us"
        eyebrow="We'd love to hear from you"
        subtitle="Quotes, samples, bulk enquiries — a gifting manager will get back within one business day."
        crumbs={[{ label: "Home", href: "/" }, { label: "Contact Us" }]}
      />

      <section className="container py-12 md:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-16">
          {/* Form */}
          <div>
            <div className="mb-8 border-b border-foreground/[0.12] pb-6">
              <span className="kicker text-primary">Send a brief</span>
              <h1 className="display mt-2 flex items-center gap-3 text-[2rem] md:text-[2.5rem]">
                Get in touch
                <MessageSquareText className="size-5 text-foreground/40" aria-hidden />
              </h1>
              <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
                Have a question or want to work together? Fill out the form and we&apos;ll be in
                touch within one business day.
              </p>
            </div>
            <ContactForm />
          </div>

          {/* Info */}
          <div className="space-y-8">
            <div className="border-b border-foreground/[0.12] pb-6">
              <span className="kicker text-primary">Other ways to reach us</span>
              <h2 className="display mt-2 text-[2rem] md:text-[2.5rem]">Contact Information</h2>
            </div>

            <ul className="grid gap-x-8 sm:grid-cols-2">
              {CHANNELS.map((c, index) => {
                const inner = (
                  <>
                    <span className="flex items-center justify-between">
                      <span className="numeral text-[12px] text-primary">{String(index + 1).padStart(2, "0")}</span>
                      <c.icon className="size-4 text-foreground/40 transition-colors group-hover/ch:text-primary" aria-hidden />
                    </span>
                    <span className="mt-3 block text-[10.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">{c.title}</span>
                    <span className="display mt-1 block text-[1.15rem] leading-snug break-words transition-colors group-hover/ch:text-primary">{c.body}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{c.note}</span>
                  </>
                );
                const cls = "group/ch block h-full border-b border-foreground/[0.08] py-5";
                return (
                  <li key={c.title}>
                    {c.href ? (
                      <a href={c.href} className={cls}>
                        {inner}
                      </a>
                    ) : (
                      <div className={cls}>{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Fast lane */}
            <div className="relative overflow-hidden rounded-xl bg-brand-ink p-6 text-white">
              <span aria-hidden className="absolute -top-16 -right-16 size-48 rounded-full bg-primary/30 blur-3xl" />
              <div className="relative">
                <span className="kicker flex items-center gap-1.5 text-brand-amber">
                  <Zap className="size-4" aria-hidden /> In a hurry?
                </span>
                <p className="display mt-2.5 text-[1.4rem] text-white">Book a 15-minute call with a gifting manager.</p>
                <p className="mt-1.5 text-sm text-white/70">Pick a slot that suits you — we&apos;ll come prepared with ideas.</p>
                <BookMeetingButton
                  className="mt-5 bg-white text-foreground hover:bg-brand-amber hover:text-foreground"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-xl">
              <iframe
                title="KCS G-Mart office location"
                src="https://www.openstreetmap.org/export/embed.html?bbox=77.02%2C28.60%2C77.10%2C28.65&layer=mapnik"
                className="h-64 w-full border-0 grayscale-[35%]"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
