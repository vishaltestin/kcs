"use client";

import Image from "next/image";
import { Play } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { IMAGES } from "@/lib/constants";

/**
 * Showreel banner. The poster is a wide, dark navy strip so the copy sits on a
 * translucent panel with a pulsing play button — the modal plays the promo.
 */
export function VideoSection() {
  return (
    <section className="container" aria-label="Showreel">
      <div className="relative isolate min-h-[19rem] overflow-hidden rounded-3xl bg-[#0f1b3a] shadow-[0_28px_56px_-28px_rgb(0_0_0/0.55)] md:min-h-[22rem]">
        <Image
          src={IMAGES.videoPoster}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          priority={false}
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-[#0f1b3a]/85 via-[#0f1b3a]/35 to-[#0f1b3a]/70" />
        <div aria-hidden className="dot-grid absolute inset-0 opacity-30" />

        <Dialog>
          <div className="relative flex min-h-[19rem] flex-col items-center justify-center gap-5 px-6 py-12 text-center text-white md:min-h-[22rem]">
            <span className="eyebrow text-brand-amber">Procter assurance</span>
            <h2 className="max-w-2xl text-2xl font-extrabold leading-[1.15] tracking-tight md:text-[2.25rem]">
              Perfect Corporate Gifting Solutions for your Company
            </h2>
            <p className="max-w-lg text-[15px] leading-relaxed text-white/70">
              Watch how we take a brief from mood-board to branded boxes on desks across India.
            </p>

            <DialogTrigger
              className="group/play relative mt-2 grid size-[4.5rem] place-items-center rounded-full bg-white text-foreground shadow-[0_18px_40px_-12px_rgb(0_0_0/0.55)] transition-transform duration-300 hover:scale-105 focus-visible:ring-4 focus-visible:ring-white/40 focus-visible:outline-none"
              aria-label="Play the KCS G-Mart corporate gifting video"
            >
              <span aria-hidden className="absolute inset-0 animate-ring rounded-full bg-white/60" />
              <span aria-hidden className="absolute inset-0 animate-ring rounded-full bg-white/40 [animation-delay:0.7s]" />
              <Play className="relative ml-1 size-7 fill-current transition-colors group-hover/play:text-primary" aria-hidden />
            </DialogTrigger>
            <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/55">Watch the film · 1 min</span>
          </div>

          <DialogContent
            showCloseButton
            className="w-[min(96vw,1100px)] max-w-none border-none bg-black/95 p-2 shadow-2xl sm:p-3"
          >
            <DialogHeader className="sr-only">
              <DialogTitle>KCS G-Mart corporate gifting video</DialogTitle>
              <DialogDescription>Promo video</DialogDescription>
            </DialogHeader>
            <video
              src="/video/procter-promo-video.mp4"
              controls
              autoPlay
              playsInline
              className="aspect-video w-full rounded-xl bg-black"
            >
              Your browser does not support the video tag.
            </video>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
