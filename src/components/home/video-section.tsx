"use client";

import Image from "next/image";
import Link from "next/link";
import { MoveRight, Play } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { HomeBand } from "@/lib/home-bands";

/**
 * Showreel band — the classic full-bleed treatment: the film still runs edge to
 * edge, the headline sits centred on top of it, and the circular `.play-modal`
 * control opens the video in a dialog sized to the viewport (not a postage
 * stamp — that was a client complaint we fixed once already).
 *
 * Copy, art and the film itself come from Admin → Home bands.
 */
export function VideoSection({ band }: { band: HomeBand }) {
  const videoSrc = band.videoUrl ?? "/video/procter-promo-video.mp4";

  return (
    <section
      className="relative isolate flex h-[350px] items-center justify-center overflow-hidden md:h-[440px] lg:h-[520px]"
      aria-label={band.title}
    >
      <Image
        src={band.image}
        alt=""
        aria-hidden
        fill
        sizes="100vw"
        quality={85}
        className="object-cover"
      />
      <span aria-hidden className="absolute inset-0 bg-black/45" />

      <div className="relative flex max-w-3xl flex-col items-center gap-3 px-5 text-center text-white">
        {band.eyebrow && <p className="text-[1.05rem] font-light sm:text-[1.3rem]">{band.eyebrow}</p>}
        <h2 className="text-[1.5rem] leading-tight font-bold sm:text-[1.9rem] lg:text-[2.4rem]">{band.title}</h2>
        {band.subtitle && <p className="max-w-xl text-[14px] leading-relaxed text-white/75">{band.subtitle}</p>}

        <Dialog>
          <DialogTrigger className="play-modal" aria-label={`Play the video: ${band.title}`}>
            <Play className="size-7 fill-current" aria-hidden />
          </DialogTrigger>

          <DialogContent
            showCloseButton
            className="w-[min(96vw,1320px)] border-none bg-black/95 p-2 sm:max-w-[min(96vw,1320px)] sm:p-3"
          >
            <DialogHeader className="sr-only">
              <DialogTitle>{band.title}</DialogTitle>
              <DialogDescription>{band.subtitle || "Promo video"}</DialogDescription>
            </DialogHeader>
            <video src={videoSrc} controls autoPlay playsInline className="block max-h-[86svh] w-full rounded-xl bg-black">
              Your browser does not support the video tag.
            </video>
          </DialogContent>
        </Dialog>

        {band.ctaLabel && band.ctaHref && (
          <Link
            href={band.ctaHref}
            className="mt-3 inline-flex items-center gap-2 text-[12px] font-bold tracking-[0.08em] text-white/80 uppercase transition-colors hover:text-white"
          >
            {band.ctaLabel} <MoveRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>
    </section>
  );
}
