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

export function VideoSection() {
  return (
    <section className="relative h-[350px] lg:h-auto">
      <Image
        src={IMAGES.videoPoster}
        alt="KCS G-Mart corporate gifting showreel"
        height={500}
        width={1500}
        className="w-full object-cover h-full lg:h-auto"
        priority={false}
      />
      <Dialog>
        <div className="flex flex-col items-center gap-2 w-[90%] text-center md:w-auto uppercase text-white absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%]">
          <p className="font-semibold">Procter Assurance</p>
          <h2 className="font-bold text-lg md:text-[20px]">
            Perfect Corporate Gifting Solutions for your Company
          </h2>
          <DialogTrigger
            className="play-modal"
            aria-label="Play the KCS G-Mart corporate gifting video"
          >
            <Play aria-hidden />
          </DialogTrigger>
        </div>
        <DialogContent className="min-w-[90%] bg-transparent border-none flex justify-center p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>KCS G-Mart corporate gifting video</DialogTitle>
            <DialogDescription>Promo video</DialogDescription>
          </DialogHeader>
          <video
            src="/video/procter-promo-video.mp4"
            controls
            autoPlay
            className="w-[90%] md:w-[70%] h-auto rounded-lg"
          >
            Your browser does not support the video tag.
          </video>
        </DialogContent>
      </Dialog>
    </section>
  );
}
