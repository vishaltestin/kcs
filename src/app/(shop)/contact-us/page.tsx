import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

import Banner from "@/components/shared/content-banner";
import { Card, CardContent } from "@/components/ui/card";
import { ContactForm } from "@/components/forms/contact-form";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with KCS G-Mart for corporate gifting, bulk enquiries and quick quotations.",
};

export default function ContactUsPage() {
  return (
    <>
      <Banner title="Contact Us" />
      <section>
        <div className="container mx-auto px-4 md:px-6 py-12 md:py-20">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold">Get in touch</h1>
                <p className="text-muted-foreground mt-2">
                  Have a question or want to work together? Fill out the form and we&apos;ll be in
                  touch within one business day.
                </p>
              </div>

              <ContactForm />
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Contact Information</h2>
                <p className="text-muted-foreground mt-2">
                  Get in touch with us using the information below.
                </p>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4 flex items-start gap-4">
                    <MapPin className="h-6 w-6 text-primary shrink-0" aria-hidden />
                    <div>
                      <h3 className="font-semibold">Office Address</h3>
                      <p className="text-sm text-muted-foreground">{SITE.address}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 flex items-start gap-4">
                    <Phone className="h-6 w-6 text-primary shrink-0" aria-hidden />
                    <div>
                      <h3 className="font-semibold">Phone</h3>
                      <p className="text-sm text-muted-foreground">
                        <a href={SITE.phoneHref} className="hover:text-primary">
                          +91 78381 52753
                        </a>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 flex items-start gap-4">
                    <Mail className="h-6 w-6 text-primary shrink-0" aria-hidden />
                    <div>
                      <h3 className="font-semibold">Email</h3>
                      <p className="text-sm text-muted-foreground">
                        <a href={`mailto:${SITE.email}`} className="hover:text-primary">
                          {SITE.email}
                        </a>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 flex items-start gap-4">
                    <Clock className="h-6 w-6 text-primary shrink-0" aria-hidden />
                    <div>
                      <h3 className="font-semibold">Business Hours</h3>
                      <p className="text-sm text-muted-foreground">
                        Monday – Saturday: 10:00 AM – 7:00 PM IST
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <iframe
                    title="KCS G-Mart office location"
                    src="https://www.openstreetmap.org/export/embed.html?bbox=77.02%2C28.60%2C77.10%2C28.65&layer=mapnik"
                    className="w-full h-64 border-0"
                    loading="lazy"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
