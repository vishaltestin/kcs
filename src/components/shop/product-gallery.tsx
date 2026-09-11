"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, PlayCircle, X } from "lucide-react";

import { Video } from "@/components/shop/video";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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
  const [lightbox, setLightbox] = useState(false);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const safeImages = images.length > 0 ? images : ["/images/demo.png"];
  const many = safeImages.length > 1;

  const nextImage = useCallback(
    () => setCurrentImage((prev) => (prev + 1) % safeImages.length),
    [safeImages.length]
  );
  const prevImage = useCallback(
    () => setCurrentImage((prev) => (prev - 1 + safeImages.length) % safeImages.length),
    [safeImages.length]
  );

  // Keyboard navigation while the lightbox is open
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, nextImage, prevImage]);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    setZoom({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div className="space-y-4">
      <div className={cn("flex flex-col gap-3", many && "md:flex-row-reverse")}>
        {/* Main stage */}
        <div
          ref={stageRef}
          onMouseMove={onMove}
          onMouseLeave={() => setZoom(null)}
          className="group/stage relative aspect-square w-full flex-1 cursor-zoom-in overflow-hidden rounded-2xl bg-white ring-1 ring-foreground/[0.07]"
          onClick={() => setLightbox(true)}
        >
          <Image
            key={safeImages[currentImage]}
            src={safeImages[currentImage]}
            alt={`${name} — image ${currentImage + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 640px"
            quality={90}
            priority
            className="animate-fade-up object-contain p-4 transition-transform duration-300 ease-out"
            style={
              zoom
                ? { transform: "scale(1.8)", transformOrigin: `${zoom.x}% ${zoom.y}%` }
                : undefined
            }
          />

          {/* Counter + expand */}
          <div className="pointer-events-none absolute top-3 right-3 flex items-center gap-2">
            {many && (
              <span className="rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white tabular-nums backdrop-blur">
                {currentImage + 1} / {safeImages.length}
              </span>
            )}
            <span className="grid size-8 place-items-center rounded-full bg-white/90 text-foreground opacity-0 shadow ring-1 ring-foreground/5 transition-opacity group-hover/stage:opacity-100">
              <Expand className="size-4" aria-hidden />
            </span>
          </div>

          {many && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute top-1/2 left-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-foreground opacity-0 shadow-lg ring-1 ring-foreground/5 transition-all hover:bg-primary hover:text-primary-foreground group-hover/stage:opacity-100 focus-visible:opacity-100"
                aria-label="Previous image"
              >
                <ChevronLeft className="size-5" aria-hidden />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute top-1/2 right-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-foreground opacity-0 shadow-lg ring-1 ring-foreground/5 transition-all hover:bg-primary hover:text-primary-foreground group-hover/stage:opacity-100 focus-visible:opacity-100"
                aria-label="Next image"
              >
                <ChevronRight className="size-5" aria-hidden />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {many && (
          <div
            className="no-scrollbar flex gap-2.5 overflow-x-auto md:w-[4.75rem] md:flex-col md:overflow-y-auto"
            role="tablist"
            aria-label="Product images"
          >
            {safeImages.map((src, index) => (
              <button
                key={src + index}
                role="tab"
                onClick={() => setCurrentImage(index)}
                onMouseEnter={() => setCurrentImage(index)}
                aria-label={`View image ${index + 1}`}
                aria-selected={currentImage === index}
                className={cn(
                  "relative aspect-square w-[4.25rem] shrink-0 overflow-hidden rounded-xl bg-white ring-1 transition-all md:w-full",
                  currentImage === index
                    ? "ring-2 ring-primary"
                    : "ring-foreground/[0.08] opacity-70 hover:opacity-100 hover:ring-foreground/20"
                )}
              >
                <Image src={src} alt={`${name} thumbnail ${index + 1}`} fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {video && (
        <div className="overflow-hidden rounded-2xl ring-1 ring-foreground/[0.07]">
          <div className="flex items-center gap-2 border-b bg-surface px-4 py-2.5">
            <PlayCircle className="size-4 text-primary" aria-hidden />
            <h3 className="text-sm font-bold">Product video</h3>
          </div>
          <Video src={video} />
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={lightbox} onOpenChange={setLightbox}>
        <DialogContent
          showCloseButton={false}
          className="max-w-[min(96vw,1100px)] border-none bg-black/95 p-0 text-white sm:rounded-2xl"
        >
          <DialogTitle className="sr-only">{name} — image gallery</DialogTitle>
          <div className="relative aspect-[4/3] w-full">
            <Image
              src={safeImages[currentImage]}
              alt={`${name} — image ${currentImage + 1}`}
              fill
              sizes="96vw"
              quality={90}
              className="object-contain"
            />
            <button
              onClick={() => setLightbox(false)}
              className="absolute top-3 right-3 grid size-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
              aria-label="Close gallery"
            >
              <X className="size-5" aria-hidden />
            </button>
            {many && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute top-1/2 left-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="size-6" aria-hidden />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute top-1/2 right-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
                  aria-label="Next image"
                >
                  <ChevronRight className="size-6" aria-hidden />
                </button>
                <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
                  {safeImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImage(i)}
                      aria-label={`Go to image ${i + 1}`}
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        i === currentImage ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
