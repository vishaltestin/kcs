import Image from "next/image";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Shows the *whole* picture inside a fixed-ratio frame — no cropping.
 *
 * Editorial imagery (blog covers, category heroes, promo tiles) arrives in
 * every ratio imaginable. `object-cover` silently slices titles and products
 * off the edges; plain `object-contain` leaves hard letterbox bars. This frame
 * sits the sharp image over a heavily blurred wash of itself, so the picture
 * stays intact while the frame still reads as one continuous surface.
 *
 * The caller owns the ratio/rounding via `className` (e.g. `aspect-[3/2]
 * rounded-xl`); `children` render above the image (gradients, captions).
 */
export function FramedImage({
  src,
  alt,
  sizes,
  priority = false,
  quality,
  className,
  imgClassName,
  washClassName,
  children,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  quality?: number;
  /** Frame box classes — ratio, radius, ring. Always rendered `relative overflow-hidden`. */
  className?: string;
  /** Extra classes for the sharp image (e.g. hover transforms, padding). */
  imgClassName?: string;
  /** Tint laid over the blurred wash (defaults to a faint darkening). */
  washClassName?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("relative isolate overflow-hidden bg-muted", className)}>
      {/* Blurred wash — a tiny source, scaled past the edges so the blur never shows a border */}
      <Image
        src={src}
        alt=""
        aria-hidden
        fill
        sizes="96px"
        quality={30}
        className="scale-125 object-cover blur-2xl saturate-125"
      />
      <span aria-hidden className={cn("absolute inset-0 bg-foreground/[0.08]", washClassName)} />
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        quality={quality}
        sizes={sizes}
        className={cn("object-contain", imgClassName)}
      />
      {children}
    </div>
  );
}
