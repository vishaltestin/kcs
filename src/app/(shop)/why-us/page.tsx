import type { Metadata } from "next";
import Image from "next/image";

import Banner from "@/components/shared/content-banner";
import { IMAGES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Why Choose Us",
  description:
    "Automation, prompt sales support, training & development and last-mile delivery — the KCS G-Mart advantage.",
};

export default function WhyUsPage() {
  return (
    <main>
      <Banner title="Why Choose Us" />

      <section className="mt-10">
        <div className="container mx-auto px-4">
          <h2 className="font-extrabold text-3xl md:text-5xl mb-10">Our Services</h2>

          <div className="flex flex-col md:flex-row items-center gap-8 mb-16">
            <div className="md:w-1/2 md:order-2">
              <p className="text-[1rem] text-muted-foreground">
                <strong>Automation:</strong> We employ advanced automation across every facet of
                our operations, from implementing innovative loyalty reward programs to optimizing
                our delivery systems and streamlining inventory management. This comprehensive
                automation ensures that our processes operate seamlessly, consistently delivering a
                remarkable experience that exceeds expectations for both our partners and
                associates.
              </p>
            </div>
            <div className="md:w-1/2 md:order-1">
              <div className="relative aspect-[3/2] overflow-hidden rounded-xl shadow-lg">
              <Image
                src={IMAGES.whyUs.automation}
                alt="Automation driven gifting operations"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8 mb-16">
            <div className="md:w-1/2">
              <p className="text-[1rem] text-muted-foreground">
                <strong>Prompt Sales Support:</strong> Our gifting managers respond within hours,
                not days. From first enquiry to final delivery, a dedicated point of contact keeps
                you updated at every step — with quick quotes, mockups and samples.
              </p>
            </div>
            <div className="md:w-1/2">
              <div className="relative aspect-[3/2] overflow-hidden rounded-xl shadow-lg">
              <Image
                src={IMAGES.whyUs.promptSales}
                alt="Prompt sales support"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8 mb-16">
            <div className="md:w-1/2 md:order-2">
              <p className="text-[1rem] text-muted-foreground">
                <strong>Training &amp; Development:</strong> We invest heavily in our people. Every
                team member is trained on product knowledge, branding techniques and client
                etiquette, so you always deal with experts who understand corporate gifting
                end-to-end.
              </p>
            </div>
            <div className="md:w-1/2 md:order-1">
              <div className="relative aspect-[3/2] overflow-hidden rounded-xl shadow-lg">
              <Image
                src={IMAGES.whyUs.training}
                alt="Training and development"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2">
              <p className="text-[1rem] text-muted-foreground">
                <strong>Last-Mile Delivery:</strong> With warehousing partners across metros and a
                robust last-mile network, we deliver to offices, campuses and homes in 19,000+
                pin codes — individually gift-wrapped and quality-checked.
              </p>
            </div>
            <div className="md:w-1/2">
              <div className="relative aspect-[3/2] overflow-hidden rounded-xl shadow-lg">
              <Image
                src={IMAGES.whyUs.lmd}
                alt="Last mile delivery services"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
