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

      <section className="container mx-auto px-4 py-12 md:px-6 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-14">
          {/* Form */}
          <div className="rounded-3xl bg-card p-6 ring-1 ring-foreground/[0.07] shadow-[0_28px_56px_-32px_rgb(0_0_0/0.35)] md:p-9">
            <div className="mb-7 flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/[0.08] text-primary">
                <MessageSquareText className="size-5" aria-hidden />
              </span>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Get in touch</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Have a question or want to work together? Fill out the form and we&apos;ll be in
                  touch within one business day.
                </p>
              </div>
            </div>
            <ContactForm />
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <p className="eyebrow text-primary">Other ways to reach us</p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight">Contact Information</h2>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2">
              {CHANNELS.map((c) => {
                const inner = (
                  <>
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/[0.08] text-primary transition-colors group-hover/ch:bg-primary group-hover/ch:text-primary-foreground">
                      <c.icon className="size-4.5" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold tracking-wide text-muted-foreground uppercase">{c.title}</span>
                      <span className="mt-0.5 block text-sm font-semibold leading-snug break-words">{c.body}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{c.note}</span>
                    </span>
                  </>
                );
                const cls =
                  "group/ch flex h-full items-start gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/[0.07] transition-all";
                return (
                  <li key={c.title}>
                    {c.href ? (
                      <a href={c.href} className={`${cls} hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-20px_rgb(0_0_0/0.3)]`}>
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
            <div className="relative overflow-hidden rounded-2xl bg-brand-charcoal p-6 text-white">
              <div aria-hidden className="dot-grid absolute inset-0 opacity-40" />
              <div aria-hidden className="absolute -top-16 -right-16 size-48 rounded-full bg-primary/40 blur-3xl" />
              <div className="relative">
                <p className="eyebrow flex items-center gap-1.5 text-brand-amber">
                  <Zap className="size-3.5" aria-hidden /> In a hurry?
                </p>
                <p className="mt-2 text-lg font-extrabold tracking-tight">Book a 15-minute call with a gifting manager.</p>
                <p className="mt-1 text-sm text-white/70">Pick a slot that suits you — we&apos;ll come prepared with ideas.</p>
                <BookMeetingButton
                  className="mt-4 bg-white text-foreground hover:bg-brand-amber hover:text-foreground"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl ring-1 ring-foreground/[0.07]">
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
