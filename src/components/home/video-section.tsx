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
 * Showreel band: copy on the left, a real still from the film on the right
 * (shown whole, in its own 3:2 frame) with the play control sitting on it.
 */
export function VideoSection() {
  return (
    <section className="container" aria-label="Showreel">
      <div className="relative isolate overflow-hidden rounded-2xl bg-brand-ink text-white shadow-[0_28px_56px_-28px_rgb(0_0_0/0.55)]">
        <span aria-hidden className="absolute -top-32 -left-24 size-[26rem] rounded-full bg-primary/25 blur-[100px]" />
        <span aria-hidden className="absolute -right-24 -bottom-40 size-[22rem] rounded-full bg-brand-amber/10 blur-[90px]" />

        <Dialog>
          <div className="relative grid items-center gap-8 px-7 py-9 md:px-12 md:py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-14">
            <div className="max-w-xl">
              <span className="kicker text-brand-amber">Procter assurance</span>
              <h2 className="display mt-2 text-[2rem] text-white md:text-[2.6rem]">
                Perfect Corporate Gifting Solutions for your Company
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/65">
                Watch how we take a brief from mood-board to branded boxes on desks across India.
              </p>

              <DialogTrigger
                className="group/play mt-7 flex w-max items-center gap-4 rounded-full border border-white/20 py-2 pr-6 pl-2 text-left transition-colors hover:border-white/50 hover:bg-white/5 focus-visible:ring-4 focus-visible:ring-white/30 focus-visible:outline-none"
                aria-label="Play the KCS G-Mart corporate gifting video"
              >
                <span className="relative grid size-14 place-items-center rounded-full bg-white text-foreground">
                  <span aria-hidden className="absolute inset-0 animate-ring rounded-full bg-white/50" />
                  <Play className="relative ml-0.5 size-5 fill-current transition-colors group-hover/play:text-primary" aria-hidden />
                </span>
                <span className="flex flex-col">
                  <span className="text-[14px] font-semibold">Watch the film</span>
                  <span className="text-[11px] uppercase tracking-[0.16em] text-white/50">1 min 12 s · sound on</span>
                </span>
              </DialogTrigger>
            </div>

            {/* Film still — whole frame, never cropped */}
            <DialogTrigger
              className="group/still relative block aspect-[3/2] w-full overflow-hidden rounded-xl ring-1 ring-white/10 focus-visible:ring-4 focus-visible:ring-white/40 focus-visible:outline-none"
              aria-label="Play the KCS G-Mart corporate gifting video"
            >
              <Image
                src={IMAGES.videoPoster}
                alt="A still from the KCS G-Mart corporate gifting film"
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/still:scale-[1.03]"
              />
              <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid size-16 place-items-center rounded-full bg-white/90 text-foreground shadow-[0_18px_40px_-12px_rgb(0_0_0/0.5)] backdrop-blur transition-transform duration-300 group-hover/still:scale-105">
                  <Play className="ml-0.5 size-6 fill-current" aria-hidden />
                </span>
              </span>
              <span className="absolute bottom-3 left-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/85 backdrop-blur-sm">
                Showreel · 01:12
              </span>
            </DialogTrigger>
          </div>

          <DialogContent
            showCloseButton
            className="w-[min(96vw,1320px)] sm:max-w-[min(96vw,1320px)] border-none bg-black/95 p-2 shadow-2xl sm:p-3"
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
              className="block h-auto max-h-[86svh] w-full rounded-xl bg-black"
            >
              Your browser does not support the video tag.
            </video>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
