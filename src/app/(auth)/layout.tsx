import Image from "next/image";
import Link from "next/link";

import { Logo } from "@/components/shared/logo";
import { IMAGES } from "@/lib/constants";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: form */}
      <div className="flex flex-col p-6 md:p-12">
        <Link href="/" className="mb-10 self-start" aria-label="KCS G-Mart home">
          <Logo size={90} withLink={false} />
        </Link>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md">{children}</div>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} KCS G-Mart. All rights reserved.
        </p>
      </div>

      {/* Right: hero image (desktop) */}
      <div className="hidden lg:block relative">
        <Image
          src={IMAGES.homeBanners[0]}
          alt="Corporate gifting by KCS G-Mart"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <h2 className="text-3xl font-bold leading-tight">
            India&apos;s most trusted corporate gifting partner
          </h2>
          <p className="mt-3 text-white/80 max-w-md">
            Branded gifts, curated hampers and joining kits with pan-India delivery and tiered bulk
            pricing.
          </p>
        </div>
      </div>
    </div>
  );
}
