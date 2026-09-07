import Image from "next/image";
import Link from "next/link";

import { IMAGES } from "@/lib/constants";

export function Logo({ size = 100, withLink = true }: { size?: number; withLink?: boolean }) {
  const img = (
    <Image
      src={IMAGES.logo}
      width={size}
      height={size}
      alt="KCS G-Mart"
      priority
      className="object-contain"
    />
  );

  if (!withLink) return img;
  return (
    <Link href="/" aria-label="KCS G-Mart home" className="shrink-0">
      {img}
    </Link>
  );
}
