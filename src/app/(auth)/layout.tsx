import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, ShieldCheck, Truck } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { IMAGES } from "@/lib/constants";

const PROOF = [
  { icon: BadgeCheck, text: "500+ corporate clients" },
  { icon: Truck, text: "19,000+ PIN codes served" },
  { icon: ShieldCheck, text: "GST invoice on every order" },
];

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Left: form */}
      <div className="relative flex flex-col px-6 py-6 md:px-12 md:py-8">
        <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(60%_50%_at_50%_0%,black,transparent)]" />
        <div className="relative flex items-center justify-between">
          <Link href="/" aria-label="KCS G-Mart home">
            <Logo size={84} withLink={false} />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4" aria-hidden /> Back to store
          </Link>
        </div>
        <div className="relative flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
        <p className="relative text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} KCS G-Mart. All rights reserved.
        </p>
      </div>

      {/* Right: hero image (desktop) */}
      <div className="relative hidden overflow-hidden bg-brand-charcoal lg:block">
        <Image
          src={IMAGES.homeBanners[0]}
          alt="Corporate gifting by KCS G-Mart"
          fill
          priority
          sizes="55vw"
          className="object-cover"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

        <div className="absolute top-10 left-12 flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur">
          <span className="size-1.5 rounded-full bg-brand-amber" aria-hidden />
          India&apos;s trusted gifting partner
        </div>

        <div className="absolute right-12 bottom-12 left-12 text-white">
          <h2 className="max-w-lg text-4xl font-extrabold leading-[1.05] tracking-tight">
            Gifts that say the right thing — <span className="text-brand-amber">at scale.</span>
          </h2>
          <p className="mt-4 max-w-md text-white/80">
            Branded gifts, curated hampers and joining kits with pan-India delivery and tiered bulk
            pricing.
          </p>
          <ul className="mt-7 flex flex-wrap gap-2.5">
            {PROOF.map((p) => (
              <li
                key={p.text}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-[13px] font-medium ring-1 ring-white/15 backdrop-blur"
              >
                <p.icon className="size-4 text-brand-amber" aria-hidden />
                {p.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
