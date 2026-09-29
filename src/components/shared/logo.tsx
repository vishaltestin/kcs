import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { IMAGES } from "@/lib/constants";

/**
 * Stacked brand lockup (icon over wordmark) — used where there is room for a
 * tall mark, e.g. the auth screen and the footer brand card.
 */
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

/**
 * Icon-only brand mark for the sticky navbar — keeps the header calm while
 * giving the mark real presence (the stacked asset's wordmark is unreadable
 * at header sizes, and a text lockup crowded the nav rail).
 */
export function LogoMark({
  height = 44,
  withLink = true,
  className,
}: {
  height?: number;
  withLink?: boolean;
  className?: string;
}) {
  const img = (
    <Image
      src={IMAGES.logoMark}
      width={Math.round(height * (204 / 173))}
      height={height}
      alt="KCS G-Mart"
      priority
      className={cn("w-auto shrink-0", className)}
      style={{ height }}
    />
  );

  if (!withLink) return img;
  return (
    <Link href="/" aria-label="KCS G-Mart home" className="shrink-0">
      {img}
    </Link>
  );
}
