import { IMAGES } from "@/lib/constants";

/**
 * The home page's two full-bleed promo bands (drinkware offer, showreel).
 *
 * These are the blocks that get rewritten every season, so they live in the
 * `HomeBanner` table — one row per slot, edited under Admin → Home bands.
 * What is here is the fallback the storefront renders when a row has never
 * been saved, the pre-fill the admin form starts from, and the length limits
 * the form mirrors — one source of truth for "what the band says by default".
 */
export const HOME_BANNER_SLOTS = ["drinkware", "video"] as const;
export type HomeBannerSlot = (typeof HOME_BANNER_SLOTS)[number];

export type HomeBand = {
  slot: HomeBannerSlot;
  /** Small line above the headline (drinkware: "Best Price & High Quality"). */
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
  /** Video slot only; `null` plays the film bundled with the app. */
  videoUrl: string | null;
};

export const HOME_BAND_LABELS: Record<HomeBannerSlot, string> = {
  drinkware: "Drinkware offer band",
  video: "Showreel band",
};

export const HOME_BAND_HINTS: Record<HomeBannerSlot, string> = {
  drinkware:
    "The strip above the footer: uppercase headline over the artwork, one supporting line and the shop button.",
  video:
    "The film band after the category grid. The play button opens it in a dialog; leave the source blank to keep the bundled reel.",
};

export const HOME_BAND_DEFAULTS: Record<HomeBannerSlot, HomeBand> = {
  drinkware: {
    slot: "drinkware",
    eyebrow: "Best Price & High Quality",
    title: "Drinkwares for Corporate Gifts",
    subtitle:
      "Insulated bottles, tumblers and mugs — laser-engraved with your logo, packed for desks across India.",
    ctaLabel: "Shop Now",
    ctaHref: "/category/drinkwares",
    image: IMAGES.drinkware,
    videoUrl: null,
  },
  video: {
    slot: "video",
    eyebrow: "Watch the film",
    title: "Perfect Corporate Gifting Solutions for your Company",
    subtitle: "A one-minute look at how a brief becomes branded boxes on desks across India.",
    ctaLabel: "Browse the catalogue",
    ctaHref: "/product",
    image: IMAGES.videoPoster,
    videoUrl: "/video/procter-promo-video.mp4",
  },
};

/** Field limits, kept next to the Prisma column widths so the two can't drift. */
export const HOME_BAND_LIMITS = {
  eyebrow: 120,
  title: 200,
  subtitle: 400,
  ctaLabel: 40,
  ctaHref: 200,
} as const;

/** Shape of a `HomeBanner` row as selected by the queries (plain values only). */
export type HomeBannerRow = {
  slot: string;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  image: string | null;
  videoUrl: string | null;
  isActive: boolean;
};

const blank = (value: string | null) => value?.trim() ?? "";

/**
 * Rows → what each storefront slot renders.
 * `null` means "do not render this band" (it was switched off in the admin).
 */
export function resolveHomeBands(rows: HomeBannerRow[]): Record<HomeBannerSlot, HomeBand | null> {
  const bands = {} as Record<HomeBannerSlot, HomeBand | null>;

  for (const slot of HOME_BANNER_SLOTS) {
    const fallback = HOME_BAND_DEFAULTS[slot];
    const row = rows.find((r) => r.slot === slot);

    if (!row) {
      bands[slot] = fallback;
      continue;
    }
    if (!row.isActive) {
      bands[slot] = null;
      continue;
    }

    bands[slot] = {
      slot,
      eyebrow: blank(row.eyebrow),
      title: blank(row.title) || fallback.title,
      subtitle: blank(row.subtitle),
      ctaLabel: blank(row.ctaLabel),
      ctaHref: blank(row.ctaHref),
      image: blank(row.image) || fallback.image,
      videoUrl: blank(row.videoUrl) || fallback.videoUrl,
    };
  }

  return bands;
}

/** Form pre-fill: the stored row where there is one, the defaults where not. */
export type HomeBandFormValue = HomeBand & { isActive: boolean };

export function toHomeBandFormValue(
  slot: HomeBannerSlot,
  row?: HomeBannerRow | null
): HomeBandFormValue {
  const fallback = HOME_BAND_DEFAULTS[slot];
  if (!row) return { ...fallback, isActive: true };
  return {
    slot,
    eyebrow: blank(row.eyebrow),
    title: row.title,
    subtitle: blank(row.subtitle),
    ctaLabel: blank(row.ctaLabel),
    ctaHref: blank(row.ctaHref),
    image: blank(row.image),
    videoUrl: blank(row.videoUrl) || fallback.videoUrl,
    isActive: row.isActive,
  };
}
