"use client";

import { useState } from "react";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Video } from "@/components/shop/video";

export function ProductGallery({
  images,
  name,
  video,
}: {
  images: string[];
  name: string;
  video?: string | null;
}) {
  const [currentImage, setCurrentImage] = useState(0);
  const safeImages = images.length > 0 ? images : ["/images/demo.png"];

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % safeImages.length);
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + safeImages.length) % safeImages.length);

  return (
    <div className="space-y-4">
      <div className="aspect-square relative w-full max-h-[500px] flex items-center bg-white rounded-lg border">
        <Image
          src={safeImages[currentImage]}
          alt={`${name} — image ${currentImage + 1}`}
          className="object-contain rounded-lg max-w-full w-full h-full"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
        {safeImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" aria-hidden />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" aria-hidden />
            </button>
          </>
        )}
      </div>

      {safeImages.length > 1 && (
        <div className="grid grid-cols-4 gap-4">
          {safeImages.map((src, index) => (
            <button
              key={src + index}
              onClick={() => setCurrentImage(index)}
              aria-label={`View image ${index + 1}`}
              aria-current={currentImage === index}
              className={`aspect-square relative rounded-md overflow-hidden border-2 transition-colors ${
                currentImage === index ? "border-primary" : "border-border hover:border-muted-foreground"
              }`}
            >
              <Image
                src={src}
                alt={`${name} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                fill
                sizes="120px"
              />
            </button>
          ))}
        </div>
      )}

      {video && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Product Video</h3>
          <Video src={video} />
        </div>
      )}
    </div>
  );
}
