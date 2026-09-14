"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, Layers3, PlayCircle, X } from "lucide-react";

import { Video } from "@/components/shop/video";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { selectPreviewFor, useVariantPreview } from "@/store/variant-preview";
import { cn } from "@/lib/utils";

/**
 * PDP media stage. The image of the selected variant is pinned in front of the
 * product gallery (so a colour/size photo is actually visible instead of a
 * 48 px chip), and clicking either opens a full-viewport lightbox.
 */
export function ProductGallery({
  images,
  name,
  video,
  productId,
}: {
  images: string[];
  name: string;
  video?: string | null;
  productId: string;
}) {
  const preview = useVariantPreview(selectPreviewFor(productId));
  const variantImage = preview?.image ?? null;
  const variantLabel = preview?.label || null;
  const baseImages = images.length > 0 ? images : ["/images/demo.png"];
  const variantFirst = !!variantImage && !baseImages.includes(variantImage);
  const safeImages = variantFirst ? [variantImage as string, ...baseImages] : baseImages;
  const [currentImage, setCurrentImage] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const many = safeImages.length > 1;
  const showingVariant = variantFirst && currentImage === 0;

  // Picking a different variant brings its photo to the front of the stage.
  // Adjusted during render (React's "adjust state when a prop changes"
  // pattern) rather than in an effect, so no extra paint is wasted.
  const [lastVariantImage, setLastVariantImage] = useState(variantImage);
  if (variantImage !== lastVariantImage) {
    setLastVariantImage(variantImage);
    if (variantFirst) setCurrentImage(0);
  }

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
      if (e.key === "Escape") setLightbox(false);
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
          className="studio group/stage relative aspect-square w-full flex-1 cursor-zoom-in overflow-hidden rounded-xl shadow-[inset_0_0_0_1px_rgb(17_24_39/0.05)]"
          onClick={() => setLightbox(true)}
        >
          <Image
            key={safeImages[currentImage]}
            src={safeImages[currentImage]}
            alt={showingVariant ? `${name} — ${variantLabel ?? "selected variant"}` : `${name} — image ${currentImage + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 640px"
            quality={90}
            priority
            className="animate-fade-up object-contain p-6 mix-blend-multiply transition-transform duration-300 ease-out dark:mix-blend-normal"
            style={
              zoom
                ? { transform: "scale(1.8)", transformOrigin: `${zoom.x}% ${zoom.y}%` }
                : undefined
            }
          />

          {/* Counter + expand */}
          <div className="pointer-events-none absolute top-3 right-3 flex items-center gap-2">
            {showingVariant && variantLabel && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/90 px-2.5 py-1 text-[11px] font-semibold text-background backdrop-blur">
                <Layers3 className="size-3" aria-hidden />
                {variantLabel}
              </span>
            )}
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
            className="no-scrollbar flex gap-2.5 overflow-x-auto md:w-[5.5rem] md:flex-col md:overflow-y-auto"
            role="tablist"
            aria-label="Product images"
          >
            {safeImages.map((src, index) => (
              <button
                key={src + index}
                role="tab"
                onClick={() => setCurrentImage(index)}
                onMouseEnter={() => setCurrentImage(index)}
                aria-label={index === 0 && showingVariant ? `Selected variant — ${variantLabel ?? "image"}` : `View image ${index + 1}`}
                aria-selected={currentImage === index}
                className={cn(
                  "studio relative aspect-square w-[4.75rem] shrink-0 overflow-hidden rounded-lg ring-1 transition-all md:w-full",
                  currentImage === index
                    ? "ring-2 ring-foreground"
                    : "ring-foreground/[0.08] opacity-70 hover:opacity-100 hover:ring-foreground/30"
                )}
              >
                <Image src={src} alt={`${name} thumbnail ${index + 1}`} fill sizes="96px" className="object-contain p-1 mix-blend-multiply dark:mix-blend-normal" />
                {index === 0 && showingVariant && (
                  <span className="absolute inset-x-0 bottom-0 bg-foreground/85 py-0.5 text-center text-[9px] font-bold uppercase tracking-wide text-background">
                    Selected
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {video && (
        <div>
          <h3 className="flex items-center gap-2 border-b border-foreground/[0.12] pb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <PlayCircle className="size-3.5 text-primary" aria-hidden /> Product video
          </h3>
          <div className="mt-3 overflow-hidden rounded-xl">
            <Video src={video} title={`${name} product video`} />
          </div>
        </div>
      )}

      {/*
        Lightbox. `DialogContent` sets `sm:max-w-sm`, so the width has to be
        overridden at the same `sm:` breakpoint or the media renders 384 px wide.
      */}
      <Dialog open={lightbox} onOpenChange={setLightbox}>
        <DialogContent
          showCloseButton={false}
          className="w-[min(96vw,1400px)] sm:max-w-[min(96vw,1400px)] gap-0 border-none bg-black/95 p-0 text-white"
        >
          <DialogTitle className="sr-only">{name} — image gallery</DialogTitle>
          <div className="relative h-[min(78svh,940px)] w-full">
            <Image
              src={safeImages[currentImage]}
              alt={showingVariant ? `${name} — ${variantLabel ?? "selected variant"}` : `${name} — image ${currentImage + 1}`}
              fill
              sizes="min(96vw, 1400px)"
              quality={90}
              className="object-contain"
            />
            <button
              onClick={() => setLightbox(false)}
              className="absolute top-3 right-3 z-10 grid size-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
              aria-label="Close gallery"
            >
              <X className="size-5" aria-hidden />
            </button>
            {showingVariant && variantLabel && (
              <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                <Layers3 className="size-3.5" aria-hidden />
                {variantLabel}
              </span>
            )}
            {many && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute top-1/2 left-3 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="size-6" aria-hidden />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute top-1/2 right-3 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
                  aria-label="Next image"
                >
                  <ChevronRight className="size-6" aria-hidden />
                </button>
                <div className="absolute inset-x-0 bottom-3 flex flex-wrap justify-center gap-1.5">
                  {safeImages.map((src, i) => (
                    <button
                      key={src + i}
                      onClick={() => setCurrentImage(i)}
                      aria-label={`Go to image ${i + 1}`}
                      className={cn(
                        "size-1.5 rounded-full transition-all",
                        i === currentImage ? "w-7 bg-white" : "bg-white/40 hover:bg-white/70"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          <p className="pb-2 text-center text-[11px] text-white/45">
            Click the photo or press Esc to close · ← / → to browse
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
