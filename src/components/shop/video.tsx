"use client";

import { cn } from "@/lib/utils";
import { parseVideoSource, withAutoplay, type VideoSource } from "@/lib/video";

/**
 * Renders whatever a stored video string points at: a YouTube or Vimeo embed,
 * or a file played by the browser's own controls.
 *
 * Self-contained on purpose — it owns the 16:9 box — so every surface that has
 * a video slot gets identical framing. Embeds mount lazily and only autoplay
 * when asked, so a page that merely *has* a reel doesn't spend the visitor's
 * bandwidth on a player nobody opened.
 */
export function Video({
  src,
  title = "Video",
  autoPlay = false,
  poster,
  className,
  controls = true,
}: {
  src: string | null | undefined;
  title?: string;
  autoPlay?: boolean;
  poster?: string | null;
  className?: string;
  controls?: boolean;
}) {
  // Deliberately permissive: anything we don't recognise still gets the file
  // player (a CDN link without a file extension used to work and must keep
  // working). The admin form is where a value gets rejected.
  if (!src) return null;
  const parsed: VideoSource = parseVideoSource(src) ?? { kind: "file", src, thumbnailUrl: null, startSeconds: null };

  return (
    <div className={cn("relative aspect-video w-full overflow-hidden rounded-lg bg-black", className)}>
      {parsed.kind === "file" ? (
        <video
          src={parsed.src}
          poster={poster ?? undefined}
          controls={controls}
          autoPlay={autoPlay}
          playsInline
          preload="metadata"
          className="absolute inset-0 size-full bg-black object-contain"
        >
          Your browser does not support the video tag.
        </video>
      ) : (
        <iframe
          src={autoPlay ? withAutoplay(parsed) : parsed.embedUrl}
          title={title}
          className="absolute inset-0 size-full border-0 bg-black"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}
    </div>
  );
}
