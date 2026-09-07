import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Award, Briefcase, Users } from "lucide-react";

import Banner from "@/components/shared/content-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IMAGES } from "@/lib/constants";

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

export default function AboutUsPage() {
  return (
    <main>
      <Banner title="About Us" />

      <section className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">Who We Are</h2>
            <p className="text-muted-foreground mb-4">
              KCS G-Mart is one of India&apos;s most trusted corporate gifting companies. We help
              businesses celebrate milestones, welcome new joiners and delight clients through
              thoughtfully curated, brand-customised gifts — delivered pan-India.
            </p>
            <p className="text-muted-foreground mb-6">
              From premium tech gadgets and drinkware to gourmet hampers and logo-printed apparel,
              our catalogue is built for every budget and every brief. With in-house branding,
              quality checks and dedicated account managers, we make corporate gifting effortless.
            </p>
            <Button asChild>
              <Link href="/contact-us">Work With Us</Link>
            </Button>
          </div>
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden shadow-lg">
            <Image
              src={IMAGES.homeGrid.corporate}
              alt="KCS G-Mart corporate gifting"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <section className="bg-muted/50 py-12">
        <div className="container mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-3">
              <stat.icon className="h-10 w-10 text-primary" aria-hidden />
              <p className="text-4xl font-extrabold">{stat.value}</p>
              <p className="text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-10">What Our Clients Say</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial) => (
            <Card key={testimonial.name}>
              <CardContent className="p-6">
                <p className="text-muted-foreground mb-4">&ldquo;{testimonial.content}&rdquo;</p>
                <p className="font-semibold">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
